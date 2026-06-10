import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Payload {
  level: string; // difficulty_enum
  stage: number;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
}

const BASE_SCORE: Record<string, number> = {
  'easy': 1000, 'easy-medium': 1500, 'medium': 2000,
  'medium-hard': 2800, 'hard': 3500, 'hard-expert': 4200, 'expert': 5000
};

const PRACTICE_COINS: Record<string, number> = {
  'easy': 5, 'easy-medium': 8, 'medium': 10,
  'medium-hard': 15, 'hard': 20, 'hard-expert': 28, 'expert': 35
};

const PRACTICE_XP: Record<string, number> = {
  'easy': 50, 'easy-medium': 80, 'medium': 100,
  'medium-hard': 150, 'hard': 200, 'hard-expert': 280, 'expert': 350
};

function computePracticeScore(diff: string, time: number, mistakes: number, hints: number): number {
  const base = BASE_SCORE[diff] ?? 2000;
  const timePenalty = Math.min(time * 2, base * 0.5);
  const mistakePenalty = mistakes * 50;
  const hintPenalty = hints * 150;
  return Math.max(100, Math.round(base - timePenalty - mistakePenalty - hintPenalty));
}

function computeXpReward(diff: string, mistakes: number, hints: number): number {
  const base = PRACTICE_XP[diff] ?? 100;
  let xp = base;
  if (mistakes === 0) xp = Math.round(xp * 1.5);
  if (hints === 0) xp = Math.round(xp * 1.3);
  return xp;
}

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

function reject(code: string, message?: string) {
  return respond(403, { error: { code, message: message ?? code } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return respond(405, { error: 'Method Not Allowed' });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return reject('UNAUTHORIZED');

  // Client used ONLY to verify the user identity via token
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
  if (authErr || !user) return reject('UNAUTHORIZED');

  // Admin client used to perform DB queries and bypass RLS (using service_role key)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return reject('INVALID_PAYLOAD');
  }

  const { level, stage, time_seconds, mistakes, hints_used } = payload;
  if (!level || stage === undefined || time_seconds === undefined || mistakes === undefined || hints_used === undefined) {
    return reject('INVALID_PAYLOAD');
  }

  const score = computePracticeScore(level, time_seconds, mistakes, hints_used);
  const coinReward = PRACTICE_COINS[level] ?? 10;
  const xpReward = computeXpReward(level, mistakes, hints_used);

  // 1. Check existing practice progress (using admin client to bypass RLS)
  const { data: existingProgress, error: fetchErr } = await supabaseAdmin
    .from('practice_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('level', level)
    .eq('stage', stage)
    .maybeSingle();

  if (fetchErr) {
    return respond(500, { error: fetchErr.message });
  }

  const isPersonalBest = !existingProgress || score > existingProgress.best_score;

  // 2. Upsert practice progress
  const upsertData = {
    user_id: user.id,
    level,
    stage,
    best_score: isPersonalBest ? score : existingProgress.best_score,
    best_time_seconds: isPersonalBest ? time_seconds : Math.min(existingProgress.best_time_seconds, time_seconds),
    best_mistakes: isPersonalBest ? mistakes : Math.min(existingProgress.best_mistakes, mistakes),
    best_hints_used: isPersonalBest ? hints_used : Math.min(existingProgress.best_hints_used, hints_used),
    plays: (existingProgress?.plays ?? 0) + 1,
    last_played_at: new Date().toISOString(),
  };

  const { error: upsertErr } = await supabaseAdmin
    .from('practice_progress')
    .upsert(upsertData, { onConflict: 'user_id,level,stage' });

  if (upsertErr) {
    return respond(500, { error: upsertErr.message });
  }

  // 3. Log game history
  const { error: histErr } = await supabaseAdmin.from('user_game_history').insert({
    user_id: user.id,
    mode: 'practice',
    level,
    stage,
    score,
    time_seconds,
    mistakes,
    hints_used,
  });

  if (histErr) {
    return respond(500, { error: histErr.message });
  }

  // 4. Grant rewards atomically
  await supabaseAdmin.rpc('grant_coins', {
    p_user_id: user.id,
    p_amount: coinReward,
    p_reason: 'practice_complete',
    p_metadata: { level, stage, score },
  });

  await supabaseAdmin.rpc('grant_xp', {
    p_user_id: user.id,
    p_amount: xpReward,
  });

  return respond(200, {
    score,
    is_personal_best: isPersonalBest,
    rewards: {
      coins: coinReward,
      xp: xpReward,
    },
  });
});
