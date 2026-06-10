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

  // Admin client to run equip RPC
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let payload: { theme_id?: string; background_id?: string; avatar?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
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
    if (errMsg.includes('theme_not_owned')) {
      return reject('THEME_NOT_OWNED', 'Theme is not owned', 403);
    }
    if (errMsg.includes('background_not_owned')) {
      return reject('BACKGROUND_NOT_OWNED', 'Background is not owned', 403);
    }
    if (errMsg.includes('avatar_item_not_owned')) {
      return reject('AVATAR_ITEM_NOT_OWNED', errMsg, 403);
    }
    if (errMsg.includes('forbidden')) {
      return reject('FORBIDDEN', 'Forbidden', 403);
    }
    return respond(500, { error: { code: 'INTERNAL_ERROR', message: rpcErr.message } });
  }

  return respond(200, {
    success: true,
  });
});
