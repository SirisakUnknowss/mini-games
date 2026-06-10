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

  // Admin client to run purchase RPC and logs
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let payload: { item_id?: string };
  try {
    payload = await req.json();
  } catch {
    await writeSystemLog(supabaseAdmin, 'error', 'shop', `Purchase request failed: invalid payload JSON`, { user_id: user.id, email: user.email });
    return reject('INVALID_PAYLOAD', 'Invalid payload', 400);
  }

  const itemId = payload.item_id;
  if (!itemId) {
    await writeSystemLog(supabaseAdmin, 'error', 'shop', `Purchase request failed: missing item_id`, { user_id: user.id, email: user.email });
    return reject('INVALID_PAYLOAD', 'Missing item_id', 400);
  }

  // Call the purchase_item DB function
  const { data, error: rpcErr } = await supabaseAdmin.rpc('purchase_item', {
    p_user_id: user.id,
    p_item_id: itemId,
  });

  if (rpcErr) {
    const errMsg = rpcErr.message;
    let code = 'INTERNAL_ERROR';
    let status = 500;
    let logMsg = `Purchase failed for item ${itemId}: ${errMsg}`;

    if (errMsg.includes('item_not_found')) {
      code = 'NOT_FOUND';
      status = 404;
      logMsg = `Purchase failed: Item ${itemId} not found or unavailable.`;
    } else if (errMsg.includes('already_owned')) {
      code = 'ALREADY_OWNED';
      status = 403;
      logMsg = `Purchase failed: Item ${itemId} is already owned.`;
    } else if (errMsg.includes('insufficient_coins')) {
      code = 'INSUFFICIENT_FUNDS';
      status = 403;
      logMsg = `Purchase failed: Insufficient coins to buy ${itemId}.`;
    } else if (errMsg.includes('forbidden')) {
      code = 'FORBIDDEN';
      status = 403;
      logMsg = `Purchase failed: Access forbidden.`;
    }

    await writeSystemLog(supabaseAdmin, status === 500 ? 'error' : 'warn', 'shop', logMsg, {
      user_id: user.id,
      email: user.email,
      item_id: itemId,
      error_code: code,
      error_message: errMsg
    });

    return reject(code, logMsg, status);
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    await writeSystemLog(supabaseAdmin, 'error', 'shop', `Purchase failed for item ${itemId}: empty result from database`, { user_id: user.id, email: user.email });
    return respond(500, { error: { code: 'INTERNAL_ERROR', message: 'Empty result from database' } });
  }

  // Log successful purchase
  await writeSystemLog(supabaseAdmin, 'info', 'shop', `Successfully purchased item: ${itemId} (new balance: ${result.new_balance} 🪙)`, {
    user_id: user.id,
    email: user.email,
    item_id: itemId,
    new_balance: result.new_balance
  });

  return respond(200, {
    success: true,
    item_id: result.purchased_item_id,
    new_balance: result.new_balance,
  });
});
