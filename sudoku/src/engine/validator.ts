// =====================================================================
// Validator — board validity checks
// =====================================================================
import type { Board } from './types';

/** True if placing `n` at (r,c) doesn't violate Sudoku rules (ignoring current cell value). */
export function isValid(board: Board, r: number, c: number, n: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (i !== c && board[r][i] === n) return false;
    if (i !== r && board[i][c] === n) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const rr = br + i;
      const cc = bc + j;
      if ((rr !== r || cc !== c) && board[rr][cc] === n) return false;
    }
  }
  return true;
}

/** True if a non-empty cell value conflicts with row/col/box peers. */
export function hasConflict(board: Board, r: number, c: number): boolean {
  const n = board[r][c];
  if (n === 0) return false;
  return !isValid(board, r, c, n);
}

/** True if board has 81 filled cells with no rule violation. */
export function isComplete(board: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false;
      if (!isValid(board, r, c, board[r][c])) return false;
    }
  }
  return true;
}

/** Compare two boards element-wise. */
export function boardsEqual(a: Board, b: Board): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

/** Deep clone a board. */
export function cloneBoard(board: Board): Board {
  return board.map(row => row.slice());
}

/** Make an empty 9x9 board. */
export function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

/** Serialize board → 81-char string. */
export function serialize(board: Board): string {
  return board.flat().join('');
}

/** Parse 81-char string → board. */
export function parse(str: string): Board {
  if (str.length !== 81) throw new Error(`Expected 81 chars, got ${str.length}`);
  const board = emptyBoard();
  for (let i = 0; i < 81; i++) {
    board[Math.floor(i / 9)][i % 9] = parseInt(str[i], 10);
  }
  return board;
}

/** Count filled cells. */
export function countClues(board: Board): number {
  let n = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) n++;
    }
  }
  return n;
}
