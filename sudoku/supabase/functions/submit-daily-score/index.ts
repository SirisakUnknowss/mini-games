// =====================================================================
// submit-daily-score — Validate + insert daily leaderboard
// Anti-cheat: see docs/02-technical/anti-cheat.md
// =====================================================================
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface Move { r: number; c: number; n: number; t: number; isHint?: boolean }

interface SubmitPayload {
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

function computeScore(diff: string, time: number, mistakes: number, hints: number): number {
  const base = BASE_SCORE[diff];
  const timePenalty = Math.min(time * 2, base * 0.4);
  const mistakePenalty = mistakes * 100;
  const hintPenalty = hints * 300;
  const noMistakeBonus = mistakes === 0 ? 500 : 0;
  const noHintBonus = hints === 0 ? 300 : 0;
  return Math.max(100, Math.round(base - timePenalty - mistakePenalty - hintPenalty + noMistakeBonus + noHintBonus));
}

function reject(code: string, details?: any) {
  return new Response(
    JSON.stringify({ error: { code, message: code, details } }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}

function ok(data: any) {
  return new Response(
    JSON.stringify(data),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  // Get user
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return reject('UNAUTHORIZED');

  const payload: SubmitPayload = await req.json();

  // === Validation ===
  if (!payload.date || !payload.moves || !Array.isArray(payload.moves)) {
    return reject('INVALID_PAYLOAD');
  }

  // Fetch puzzle (with solution — use service role key)
  const { data: puzzle, error: puzErr } = await supabase
    .from('daily_puzzles')
    .select('*')
    .eq('date', payload.date)
    .single();

  if (puzErr || !puzzle) return reject('PUZZLE_NOT_FOUND');

  // Time checks
  const startMs = new Date(payload.started_at).getTime();
  const endMs = new Date(payload.completed_at).getTime();
  const actualSeconds = Math.floor((endMs - startMs) / 1000);

  if (Math.abs(actualSeconds - payload.time_seconds) > 5) {
    return reject('TIME_MISMATCH');
  }
  if (payload.time_seconds < MIN_TIME[puzzle.difficulty]) {
    return reject('TOO_FAST');
  }
  if (payload.time_seconds > 3 * 60 * 60) {
    return reject('TOO_SLOW');
  }

  // Replay moves
  const board = puzzle.puzzle.split('').map((c: string) => parseInt(c, 10));
  const solution = puzzle.solution.split('').map((c: string) => parseInt(c, 10));
  let mistakeCount = 0;
  let hintCount = 0;
  let prevTime = 0;

  for (const move of payload.moves) {
    if (move.r < 0 || move.r > 8 || move.c < 0 || move.c > 8 || move.n < 0 || move.n > 9) {
      return reject('INVALID_MOVE');
    }
    if (move.t < prevTime) return reject('TIME_NON_MONOTONIC');
    if (move.t > payload.time_seconds * 1000 + 1000) return reject('MOVE_AFTER_END');
    prevTime = move.t;

    const idx = move.r * 9 + move.c;
    const original = puzzle.puzzle[idx];

    // Can't modify given cells unless it's a hint
    if (original !== '0' && !move.isHint) return reject('MODIFIED_GIVEN');

    if (move.isHint) hintCount++;
    if (move.n !== 0 && move.n !== solution[idx]) mistakeCount++;

    board[idx] = move.n;
  }

  if (hintCount > 3) return reject('TOO_MANY_HINTS');

  // Final state matches solution
  for (let i = 0; i < 81; i++) {
    if (board[i] !== solution[i]) return reject('SOLUTION_MISMATCH');
  }

  // Count consistency
  if (hintCount !== payload.hints_used) return reject('HINT_COUNT_MISMATCH');
  // Note: mistakes can have flexibility (player might re-mistake) but flag if very different
  if (Math.abs(mistakeCount - payload.mistakes) > 2) return reject('MISTAKE_COUNT_MISMATCH');

  // Compute score server-side
  const score = computeScore(puzzle.difficulty, payload.time_seconds, mistakeCount, hintCount);

  // Insert (unique constraint kicks in if duplicate)
  const { error: insErr } = await supabase
    .from('daily_leaderboard')
    .insert({
      date: payload.date,
      user_id: user.id,
      score,
      time_seconds: payload.time_seconds,
      mistakes: mistakeCount,
      hints_used: hintCount,
    });

  if (insErr) {
    if (insErr.code === '23505') return reject('ALREADY_SUBMITTED');
    return reject('INTERNAL_ERROR', insErr.message);
  }

  // Grant coins + XP (simplified — full version computes by difficulty)
  const coinReward = Math.floor(score / 30);
  const xpReward = Math.floor(score / 10);

  // TODO: atomic update wallet + progression
  // For brevity, two updates here — production uses transaction

  await supabase.rpc('grant_coins', {
    p_user_id: user.id,
    p_amount: coinReward,
    p_reason: 'daily_complete',
    p_metadata: { date: payload.date, score },
  });

  // TODO: get rank, check achievements, update streak

  return ok({
    success: true,
    score,
    rewards: {
      coins: coinReward,
      xp: xpReward,
    },
  });
});
