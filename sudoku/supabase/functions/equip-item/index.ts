import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function reject(code: string, message?: string, status = 403) {
  return respond(status, { error: { code, message: message ?? code } });
}

async function writeSystemLog(supabaseAdmin: any, level: string, category: string, message: string, metadata: any) {
  try {
    await supabaseAdmin.from('system_logs').insert({
      level,
      category,
      message,
      metadata: metadata || {}
    });
  } catch (err) {
    console.error('Failed to write system log:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return respond(405, { error: 'Method Not Allowed' });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return reject('UNAUTHORIZED', 'Unauthorized', 401);

  // Validate user JWT
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) return reject('UNAUTHORIZED', 'Unauthorized', 401);

  // Admin client to run equip RPC and logs
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let payload: { theme_id?: string; background_id?: string; avatar?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    await writeSystemLog(supabaseAdmin, 'error', 'shop', `Equip request failed: invalid payload JSON`, { user_id: user.id, email: user.email });
    return reject('INVALID_PAYLOAD', 'Invalid payload', 400);
  }

  const { theme_id, background_id, avatar } = payload;

  // Call the equip_item DB function
  const { data, error: rpcErr } = await supabaseAdmin.rpc('equip_item', {
    p_user_id: user.id,
    p_theme_id: theme_id ?? null,
    p_background_id: background_id ?? null,
    p_avatar: avatar ?? null,
  });

  if (rpcErr) {
    const errMsg = rpcErr.message;
    let code = 'INTERNAL_ERROR';
    let status = 500;
    let logMsg = `Equip failed: ${errMsg}`;

    if (errMsg.includes('theme_not_owned')) {
      code = 'THEME_NOT_OWNED';
      status = 403;
      logMsg = `Equip failed: Theme ${theme_id} is not owned.`;
    } else if (errMsg.includes('background_not_owned')) {
      code = 'BACKGROUND_NOT_OWNED';
      status = 403;
      logMsg = `Equip failed: Background ${background_id} is not owned.`;
    } else if (errMsg.includes('avatar_item_not_owned')) {
      code = 'AVATAR_ITEM_NOT_OWNED';
      status = 403;
      logMsg = `Equip failed: Avatar item in list is not owned. Details: ${errMsg}`;
    } else if (errMsg.includes('forbidden')) {
      code = 'FORBIDDEN';
      status = 403;
      logMsg = `Equip failed: Access forbidden.`;
    }

    await writeSystemLog(supabaseAdmin, 'warn', 'shop', logMsg, {
      user_id: user.id,
      email: user.email,
      payload,
      error_code: code,
      error_message: errMsg
    });

    return reject(code, logMsg, status);
  }

  // Log successful equip
  await writeSystemLog(supabaseAdmin, 'info', 'shop', `Successfully equipped items: theme=${theme_id || 'none'}, bg=${background_id || 'none'}`, {
    user_id: user.id,
    email: user.email,
    theme_id,
    background_id,
    avatar
  });

  return respond(200, {
    success: true,
  });
});
