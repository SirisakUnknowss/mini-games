// =====================================================================
// Generator — create Sudoku puzzles with unique solutions
// =====================================================================
import type { Board, Difficulty, PuzzleData } from './types';
import { seededRng, shuffle, hashString, type Rng } from './rng';
import { isValid, cloneBoard, emptyBoard } from './validator';
import { countSolutions } from './solver';

/** Target clue counts per difficulty */
export const TARGET_CLUES: Record<Difficulty, number> = {
  'easy': 45,
  'easy-medium': 40,
  'medium': 35,
  'medium-hard': 32,
  'hard': 28,
  'hard-expert': 25,
  'expert': 22,
};

/** Minimum acceptable clues (uniqueness may force higher than target) */
export const MIN_CLUES: Record<Difficulty, number> = {
  'easy': 40,
  'easy-medium': 36,
  'medium': 32,
  'medium-hard': 28,
  'hard': 24,
  'hard-expert': 22,
  'expert': 19,
};

/** Pick difficulty for a given day of week (0=Sun ... 6=Sat) */
export function difficultyForDayOfWeek(dow: number): Difficulty {
  const map: Difficulty[] = [
    'expert',       // Sun
    'easy',         // Mon
    'easy-medium',  // Tue
    'medium',       // Wed
    'medium-hard',  // Thu
    'hard',         // Fri
    'hard-expert',  // Sat
  ];
  return map[dow] ?? 'medium';
}

/** Fill empty board with valid solution using seeded backtracking */
function fillBoard(board: Board, rng: Rng): boolean {
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9);
    const c = i % 9;
    if (board[r][c] !== 0) continue;

    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
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

/** Generate a fully solved Sudoku board. */
export function generateSolved(rng: Rng): Board {
  const board = emptyBoard();
  fillBoard(board, rng);
  return board;
}

/**
 * Remove clues from a solved board while preserving unique solution.
 * Returns puzzle. May not reach `targetClues` due to uniqueness constraint.
 */
export function removeClues(solved: Board, targetClues: number, rng: Rng): Board {
  const puzzle = cloneBoard(solved);
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );

  let remaining = 81;
  for (const pos of positions) {
    if (remaining <= targetClues) break;
    const r = Math.floor(pos / 9);
    const c = pos % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    if (countSolutions(puzzle, 2) !== 1) {
      // Removing would create ambiguity — revert
      puzzle[r][c] = backup;
    } else {
      remaining--;
    }
  }

  return puzzle;
}

export interface GenerateOptions {
  difficulty: Difficulty;
  seed: string;
  maxAttempts?: number;
}

/**
 * Generate a Sudoku puzzle with unique solution.
 * Deterministic: same seed + difficulty → same output.
 */
export function generatePuzzle(opts: GenerateOptions): PuzzleData {
  const { difficulty, seed, maxAttempts = 20 } = opts;
  const targetClues = TARGET_CLUES[difficulty];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rng = seededRng(hashString(seed + ':' + attempt));
    const solution = generateSolved(rng);
    const puzzle = removeClues(solution, targetClues, rng);

    // Sanity check
    if (countSolutions(puzzle, 2) === 1) {
      let clues = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzle[r][c] !== 0) clues++;
        }
      }
      return { puzzle, solution, difficulty, clues, seed };
    }
  }

  throw new Error(`Failed to generate unique puzzle for seed=${seed}, difficulty=${difficulty}`);
}

/** Generate daily puzzle for a specific date (ISO YYYY-MM-DD). */
export function generateDailyPuzzle(dateIso: string): PuzzleData {
  // dateIso must be 'YYYY-MM-DD'
  const date = new Date(dateIso + 'T00:00:00Z');
  const dow = date.getUTCDay();
  const difficulty = difficultyForDayOfWeek(dow);
  return generatePuzzle({ difficulty, seed: 'daily:' + dateIso });
}
