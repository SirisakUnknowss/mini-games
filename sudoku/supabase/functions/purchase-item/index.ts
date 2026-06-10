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

  // Admin client to run purchase RPC
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let payload: { item_id?: string };
  try {
    payload = await req.json();
  } catch {
    return reject('INVALID_PAYLOAD', 'Invalid payload', 400);
  }

  const itemId = payload.item_id;
  if (!itemId) {
    return reject('INVALID_PAYLOAD', 'Missing item_id', 400);
  }

  // Call the purchase_item DB function
  const { data, error: rpcErr } = await supabaseAdmin.rpc('purchase_item', {
    p_user_id: user.id,
    p_item_id: itemId,
  });

  if (rpcErr) {
    const errMsg = rpcErr.message;
    if (errMsg.includes('item_not_found')) {
      return reject('NOT_FOUND', 'Item not found or not available', 404);
    }
    if (errMsg.includes('already_owned')) {
      return reject('ALREADY_OWNED', 'Item already owned', 403);
    }
    if (errMsg.includes('insufficient_coins')) {
      return reject('INSUFFICIENT_FUNDS', 'Insufficient coins', 403);
    }
    if (errMsg.includes('forbidden')) {
      return reject('FORBIDDEN', 'Forbidden', 403);
    }
    return respond(500, { error: { code: 'INTERNAL_ERROR', message: rpcErr.message } });
  }

  // Expecting data to be an array of table results because RPC returns a table:
  // e.g. [{"new_balance": 150, "item_id": "theme_sakura"}]
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    return respond(500, { error: { code: 'INTERNAL_ERROR', message: 'Empty result from database' } });
  }

  return respond(200, {
    success: true,
    item_id: result.item_id,
    new_balance: result.new_balance,
  });
});
