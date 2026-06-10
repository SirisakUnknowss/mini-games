// submit-daily-score — Validate + insert daily leaderboard
// Server computes score, rank, grants coins/XP/streak.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Move { r: number; c: number; n: number; t: number; isHint?: boolean }
interface Payload {
  date: string;
  started_at: string;
  completed_at: string;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
  moves: Move[];
  client_version?: string;
}

const MIN_TIME: Record<string, number> = {
  'easy': 45, 'easy-medium': 70, 'medium': 100,
  'medium-hard': 130, 'hard': 160, 'hard-expert': 200, 'expert': 240
};

const BASE_SCORE: Record<string, number> = {
  'easy': 1000, 'easy-medium': 1500, 'medium': 2000,
  'medium-hard': 2800, 'hard': 3500, 'hard-expert': 4200, 'expert': 5000
};

const BASE_COIN: Record<string, number> = {
  'easy': 50, 'easy-medium': 75, 'medium': 100,
  'medium-hard': 130, 'hard': 160, 'hard-expert': 180, 'expert': 200
};

const BASE_XP: Record<string, number> = {
  'easy': 100, 'easy-medium': 150, 'medium': 200,
  'medium-hard': 280, 'hard': 350, 'hard-expert': 420, 'expert': 500
};

function computeScore(diff: string, time: number, mistakes: number, hints: number): number {
  const base = BASE_SCORE[diff];
  const timePenalty = Math.min(time * 2, base * 0.4);
  const mistakePenalty = mistakes * 100;
  const hintPenalty = hints * 300;
  const noMistakeBonus = mistakes === 0 ? 500 : 0;
  const noHintBonus = hints === 0 ? 300 : 0;
  return Math.max(100, Math.round(base - timePenalty - mistakePenalty - hintPenalty + noMistakeBonus + noHintBonus));
}

function computeCoin(diff: string, mistakes: number, hints: number): number {
  let c = BASE_COIN[diff] ?? 100;
  if (mistakes === 0) c = Math.round(c * 1.3);
  if (hints === 0) c = Math.round(c * 1.2);
  return c;
}

function computeXp(diff: string, mistakes: number, hints: number): number {
  let xp = BASE_XP[diff] ?? 200;
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
function reject(code: string, details?: unknown) {
  return respond(403, { error: { code, message: code, details } });
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
  try { payload = await req.json(); } catch { return reject('INVALID_PAYLOAD'); }

  if (!payload.date || !Array.isArray(payload.moves)) return reject('INVALID_PAYLOAD');

  // Fetch puzzle (service role bypasses RLS)
  const { data: puzzle, error: pErr } = await supabaseAdmin
    .from('daily_puzzles').select('*').eq('date', payload.date).single();
  if (pErr || !puzzle) return reject('PUZZLE_NOT_FOUND');

  // Time sanity
  const startMs = new Date(payload.started_at).getTime();
  const endMs = new Date(payload.completed_at).getTime();
  const actualSec = Math.floor((endMs - startMs) / 1000);
  if (Math.abs(actualSec - payload.time_seconds) > 5) return reject('TIME_MISMATCH');
  if (payload.time_seconds < (MIN_TIME[puzzle.difficulty] ?? 45)) return reject('TOO_FAST');
  if (payload.time_seconds > 3 * 60 * 60) return reject('TOO_SLOW');

  // Replay moves
  const board = puzzle.puzzle.split('').map((c: string) => parseInt(c, 10));
  const solution = puzzle.solution.split('').map((c: string) => parseInt(c, 10));
  let mistakeCount = 0;
  let hintCount = 0;
  let prevTime = 0;
  for (const m of payload.moves) {
    if (m.r < 0 || m.r > 8 || m.c < 0 || m.c > 8 || m.n < 0 || m.n > 9) return reject('INVALID_MOVE');
    if (m.t < prevTime) return reject('TIME_NON_MONOTONIC');
    if (m.t > payload.time_seconds * 1000 + 1000) return reject('MOVE_AFTER_END');
    prevTime = m.t;
    const idx = m.r * 9 + m.c;
    if (puzzle.puzzle[idx] !== '0' && !m.isHint) return reject('MODIFIED_GIVEN');
    if (m.isHint) hintCount++;
    if (m.n !== 0 && m.n !== solution[idx]) mistakeCount++;
    board[idx] = m.n;
  }
  if (hintCount > 3) return reject('TOO_MANY_HINTS');
  for (let i = 0; i < 81; i++) if (board[i] !== solution[i]) return reject('SOLUTION_MISMATCH');
  if (hintCount !== payload.hints_used) return reject('HINT_COUNT_MISMATCH');
  if (Math.abs(mistakeCount - payload.mistakes) > 2) return reject('MISTAKE_COUNT_MISMATCH');

  const score = computeScore(puzzle.difficulty, payload.time_seconds, mistakeCount, hintCount);

  const { error: insErr } = await supabaseAdmin.from('daily_leaderboard').insert({
    date: payload.date,
    user_id: user.id,
    score,
    time_seconds: payload.time_seconds,
    mistakes: mistakeCount,
    hints_used: hintCount,
  });
  if (insErr) {
    if (insErr.code === '23505') return reject('ALREADY_SUBMITTED');
    return respond(500, { error: { code: 'INTERNAL_ERROR', message: insErr.message } });
  }

  // Rank
  const { data: rankRow } = await supabaseAdmin
    .from('leaderboard_view').select('rank, total_players')
    .eq('date', payload.date).eq('user_id', user.id).maybeSingle();

  // Rewards
  const coinReward = computeCoin(puzzle.difficulty, mistakeCount, hintCount);
  const xpReward = computeXp(puzzle.difficulty, mistakeCount, hintCount);

  await supabaseAdmin.rpc('grant_coins', {
    p_user_id: user.id,
    p_amount: coinReward,
    p_reason: 'daily_complete',
    p_metadata: { date: payload.date, score },
  });
  const { data: xpResult } = await supabaseAdmin.rpc('grant_xp', {
    p_user_id: user.id, p_amount: xpReward,
  });
  const { data: streakResult } = await supabaseAdmin.rpc('bump_streak_for_today', {
    p_user_id: user.id, p_date: payload.date,
  });

  // History log
  await supabaseAdmin.from('user_game_history').insert({
    user_id: user.id,
    mode: 'daily',
    level: puzzle.difficulty,
    daily_date: payload.date,
    score,
    time_seconds: payload.time_seconds,
    mistakes: mistakeCount,
    hints_used: hintCount,
  });

  return respond(200, {
    success: true,
    score,
    rank: rankRow?.rank ?? null,
    total_players: rankRow?.total_players ?? null,
    rewards: {
      coins: coinReward,
      xp: xpReward,
      leveled_up: xpResult?.[0]?.leveled_up ?? false,
      new_level: xpResult?.[0]?.new_level ?? null,
      streak: streakResult?.[0]?.out_current_streak ?? null,
      streak_milestone: streakResult?.[0]?.is_new_milestone ?? false,
    },
  });
});
