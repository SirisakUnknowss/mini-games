// =====================================================================
// Engine types — pure data, no DOM
// =====================================================================

export type Difficulty =
  | 'easy'
  | 'easy-medium'
  | 'medium'
  | 'medium-hard'
  | 'hard'
  | 'hard-expert'
  | 'expert';

export const DIFFICULTIES: Difficulty[] = [
  'easy', 'easy-medium', 'medium',
  'medium-hard', 'hard', 'hard-expert', 'expert',
];

/** 9×9 board. 0 = empty cell. */
export type Board = number[][];

/** 81-char serialized form; '0' for empty */
export type SerializedBoard = string;

export interface PuzzleData {
  puzzle: Board;
  solution: Board;
  difficulty: Difficulty;
  clues: number;
  seed: string;
}

export interface Move {
  /** row 0-8 */
  r: number;
  /** col 0-8 */
  c: number;
  /** number 0-9 (0 = erase) */
  n: number;
  /** ms since game start */
  t: number;
  /** true if this move is a hint reveal */
  isHint?: boolean;
}

export interface ScoreInput {
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
}

export interface ScoreResult {
  score: number;
  base: number;
  timePenalty: number;
  mistakePenalty: number;
  hintPenalty: number;
  noMistakeBonus: number;
  noHintBonus: number;
}

export interface CellState {
  value: number;
  given: boolean;
  hint: boolean;
}
