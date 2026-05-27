// generate-daily-puzzle
// Pre-generates daily puzzles for the next N days.
// Idempotent: skips dates that already have a puzzle.
// Auth: service-role only (no JWT) — called by pg_cron or admin trigger.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// ============================================================
// Engine (ported from src/engine/) — self-contained
// ============================================================
type Board = number[][];
type Rng = () => number;
type Difficulty = 'easy'|'easy-medium'|'medium'|'medium-hard'|'hard'|'hard-expert'|'expert';

function seededRng(seed: number): Rng {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}
function cloneBoard(b: Board): Board { return b.map(r => r.slice()); }
function serialize(b: Board): string { return b.flat().join(''); }

function isValid(board: Board, r: number, c: number, n: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (i !== c && board[r][i] === n) return false;
    if (i !== r && board[i][c] === n) return false;
  }
  const br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const rr = br+i, cc = bc+j;
    if ((rr !== r || cc !== c) && board[rr][cc] === n) return false;
  }
  return true;
}

function fillBoard(board: Board, rng: Rng): boolean {
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i/9), c = i%9;
    if (board[r][c] !== 0) continue;
    const nums = shuffle([1,2,3,4,5,6,7,8,9], rng);
    for (const n of nums) {
      if (isValid(board, r, c, n)) {
        board[r][c] = n;
        if (fillBoard(board, rng)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  }
  return true;
}

function generateSolved(rng: Rng): Board {
  const b = emptyBoard();
  fillBoard(b, rng);
  return b;
}

function countSolutions(puzzle: Board, cap = 2): number {
  const board = cloneBoard(puzzle);
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const n = board[r][c];
    if (n) {
      const bit = 1 << n;
      rows[r] |= bit; cols[c] |= bit;
      boxes[Math.floor(r/3)*3 + Math.floor(c/3)] |= bit;
    }
  }
  let count = 0;
  function findBest(): { r: number; c: number; used: number } | null {
    let best: any = null, bestCount = 10;
    for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) continue;
      const b = Math.floor(r/3)*3 + Math.floor(c/3);
      const used = rows[r] | cols[c] | boxes[b];
      let cnt = 0;
      for (let n = 1; n <= 9; n++) if (!(used & (1<<n))) cnt++;
      if (cnt < bestCount) { bestCount = cnt; best = { r, c, used }; if (cnt <= 1) return best; }
    }
    return best;
  }
  function solve(): boolean {
    if (count >= cap) return true;
    const next = findBest();
    if (!next) { count++; return count >= cap; }
    const { r, c, used } = next;
    const b = Math.floor(r/3)*3 + Math.floor(c/3);
    for (let n = 1; n <= 9; n++) {
      const bit = 1 << n;
      if (used & bit) continue;
      board[r][c] = n;
      rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      if (solve()) { board[r][c] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit; return true; }
      board[r][c] = 0; rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
    }
    return false;
  }
  solve();
  return count;
}

function removeClues(solved: Board, targetClues: number, rng: Rng): Board {
  const puzzle = cloneBoard(solved);
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i), rng);
  let remaining = 81;
  for (const pos of positions) {
    if (remaining <= targetClues) break;
    const r = Math.floor(pos / 9), c = pos % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    if (countSolutions(puzzle, 2) !== 1) puzzle[r][c] = backup;
    else remaining--;
  }
  return puzzle;
}

const TARGET_CLUES: Record<Difficulty, number> = {
  'easy': 45, 'easy-medium': 40, 'medium': 35,
  'medium-hard': 32, 'hard': 28, 'hard-expert': 25, 'expert': 22,
};

function difficultyForDay(dow: number): Difficulty {
  return (['expert','easy','easy-medium','medium','medium-hard','hard','hard-expert'] as Difficulty[])[dow] ?? 'medium';
}

function generatePuzzle(difficulty: Difficulty, seed: string) {
  const target = TARGET_CLUES[difficulty];
  for (let attempt = 0; attempt < 20; attempt++) {
    const rng = seededRng(hashString(seed + ':' + attempt));
    const solution = generateSolved(rng);
    const puzzle = removeClues(solution, target, rng);
    if (countSolutions(puzzle, 2) === 1) return { solution, puzzle };
  }
  throw new Error('failed to generate unique puzzle');
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}
function toISO(d: Date): string { return d.toISOString().slice(0, 10); }

// ============================================================
// Handler
// ============================================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const days = Math.max(1, Math.min(30, body.days ?? 30));
  const startDate = body.start_date ? new Date(body.start_date + 'T00:00:00Z') : new Date();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const generated: string[] = [];
  const skipped: string[] = [];
  const errors: { date: string; error: string }[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const dateStr = toISO(date);

    const { data: existing } = await supabase
      .from('daily_puzzles').select('date').eq('date', dateStr).maybeSingle();
    if (existing) { skipped.push(dateStr); continue; }

    try {
      const difficulty = difficultyForDay(date.getUTCDay());
      const seed = 'daily:' + dateStr;
      const { puzzle, solution } = generatePuzzle(difficulty, seed);
      const puzzleStr = serialize(puzzle);
      const solutionStr = serialize(solution);
      const solutionHash = await sha256(solutionStr);
      const clues = puzzleStr.split('').filter(c => c !== '0').length;

      const { error } = await supabase.from('daily_puzzles').insert({
        date: dateStr,
        difficulty,
        clues,
        puzzle: puzzleStr,
        solution: solutionStr,
        solution_hash: solutionHash,
        generation_seed: seed,
      });
      if (error) {
        errors.push({ date: dateStr, error: error.message });
      } else {
        generated.push(dateStr);
      }
    } catch (err) {
      errors.push({ date: dateStr, error: String(err) });
    }
  }

  return new Response(
    JSON.stringify({ generated, skipped, errors, total: days }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
