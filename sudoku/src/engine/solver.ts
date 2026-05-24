// =====================================================================
// Solver — counts solutions with early exit (uniqueness check)
// Uses bitmask optimization + MRV heuristic for speed.
// =====================================================================
import type { Board } from './types';
import { cloneBoard } from './validator';

/**
 * Count solutions up to `cap`. Returns immediately once `cap` reached.
 * Use `cap=2` for uniqueness check (returns 1 if unique, 2 if multiple).
 */
export function countSolutions(puzzle: Board, cap = 2): number {
  const board = cloneBoard(puzzle);
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  // Initialize bitmasks
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const n = board[r][c];
      if (n !== 0) {
        const bit = 1 << n;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)] |= bit;
      }
    }
  }

  let count = 0;

  function findBestEmpty(): { r: number; c: number; used: number } | null {
    let best: { r: number; c: number; used: number } | null = null;
    let bestCount = 10;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== 0) continue;
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const used = rows[r] | cols[c] | boxes[b];
        let cnt = 0;
        for (let n = 1; n <= 9; n++) {
          if (!(used & (1 << n))) cnt++;
        }
        if (cnt < bestCount) {
          bestCount = cnt;
          best = { r, c, used };
          if (cnt <= 1) return best;
        }
      }
    }
    return best;
  }

  function solve(): boolean {
    if (count >= cap) return true;
    const next = findBestEmpty();
    if (!next) {
      count++;
      return count >= cap;
    }
    const { r, c, used } = next;
    const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    for (let n = 1; n <= 9; n++) {
      const bit = 1 << n;
      if (used & bit) continue;
      board[r][c] = n;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      if (solve()) {
        board[r][c] = 0;
        rows[r] &= ~bit;
        cols[c] &= ~bit;
        boxes[b] &= ~bit;
        return true;
      }
      board[r][c] = 0;
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      boxes[b] &= ~bit;
    }
    return false;
  }

  solve();
  return count;
}

/** True iff puzzle has exactly one solution. */
export function hasUniqueSolution(puzzle: Board): boolean {
  return countSolutions(puzzle, 2) === 1;
}

/** Solve puzzle and return first solution found, or null if unsolvable. */
export function solve(puzzle: Board): Board | null {
  const board = cloneBoard(puzzle);
  const rows = new Array(9).fill(0);
  const cols = new Array(9).fill(0);
  const boxes = new Array(9).fill(0);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const n = board[r][c];
      if (n !== 0) {
        const bit = 1 << n;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[Math.floor(r / 3) * 3 + Math.floor(c / 3)] |= bit;
      }
    }
  }

  function backtrack(): boolean {
    let bestR = -1, bestC = -1, bestUsed = 0, bestCount = 10;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== 0) continue;
        const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const used = rows[r] | cols[c] | boxes[b];
        let cnt = 0;
        for (let n = 1; n <= 9; n++) if (!(used & (1 << n))) cnt++;
        if (cnt < bestCount) {
          bestCount = cnt;
          bestR = r; bestC = c; bestUsed = used;
          if (cnt === 0) return false;
        }
      }
    }
    if (bestR === -1) return true;

    const b = Math.floor(bestR / 3) * 3 + Math.floor(bestC / 3);
    for (let n = 1; n <= 9; n++) {
      const bit = 1 << n;
      if (bestUsed & bit) continue;
      board[bestR][bestC] = n;
      rows[bestR] |= bit;
      cols[bestC] |= bit;
      boxes[b] |= bit;
      if (backtrack()) return true;
      board[bestR][bestC] = 0;
      rows[bestR] &= ~bit;
      cols[bestC] &= ~bit;
      boxes[b] &= ~bit;
    }
    return false;
  }

  return backtrack() ? board : null;
}
