// =====================================================================
// Scoring — daily + practice mode
// See docs/01-game-design/leaderboard.md and coin-economy.md
// =====================================================================
import type { Difficulty, ScoreInput, ScoreResult } from './types';

export const BASE_SCORE: Record<Difficulty, number> = {
  'easy': 1000,
  'easy-medium': 1500,
  'medium': 2000,
  'medium-hard': 2800,
  'hard': 3500,
  'hard-expert': 4200,
  'expert': 5000,
};

/**
 * Daily mode scoring (stricter than practice).
 * Used for leaderboard.
 */
export function computeDailyScore(input: ScoreInput): ScoreResult {
  const base = BASE_SCORE[input.difficulty];
  const timePenalty = Math.min(input.timeSeconds * 2, base * 0.4);
  const mistakePenalty = input.mistakes * 100;
  const hintPenalty = input.hintsUsed * 300;
  const noMistakeBonus = input.mistakes === 0 ? 500 : 0;
  const noHintBonus = input.hintsUsed === 0 ? 300 : 0;

  const score = Math.max(
    100,
    Math.round(base - timePenalty - mistakePenalty - hintPenalty + noMistakeBonus + noHintBonus),
  );

  return { score, base, timePenalty, mistakePenalty, hintPenalty, noMistakeBonus, noHintBonus };
}

/**
 * Practice mode scoring (more forgiving).
 */
export function computePracticeScore(input: ScoreInput): number {
  const base = BASE_SCORE[input.difficulty];
  const timePenalty = Math.min(input.timeSeconds * 2, base * 0.5);
  const mistakePenalty = input.mistakes * 50;
  const hintPenalty = input.hintsUsed * 150;
  return Math.max(100, Math.round(base - timePenalty - mistakePenalty - hintPenalty));
}

/** Coin reward for completing daily puzzle */
export function computeDailyCoinReward(input: ScoreInput): number {
  const base: Record<Difficulty, number> = {
    'easy': 50,
    'easy-medium': 75,
    'medium': 100,
    'medium-hard': 130,
    'hard': 160,
    'hard-expert': 180,
    'expert': 200,
  };
  let reward = base[input.difficulty];
  if (input.mistakes === 0) reward = Math.round(reward * 1.3);
  if (input.hintsUsed === 0) reward = Math.round(reward * 1.2);
  return reward;
}

/** Coin reward for practice mode */
export function computePracticeCoinReward(difficulty: Difficulty): number {
  const map: Record<Difficulty, number> = {
    'easy': 5,
    'easy-medium': 8,
    'medium': 10,
    'medium-hard': 15,
    'hard': 20,
    'hard-expert': 28,
    'expert': 35,
  };
  return map[difficulty];
}

/** XP reward */
export function computeXpReward(input: ScoreInput, mode: 'daily' | 'practice'): number {
  const baseDaily: Record<Difficulty, number> = {
    'easy': 100, 'easy-medium': 150, 'medium': 200,
    'medium-hard': 280, 'hard': 350, 'hard-expert': 420, 'expert': 500,
  };
  const basePractice: Record<Difficulty, number> = {
    'easy': 50, 'easy-medium': 80, 'medium': 100,
    'medium-hard': 150, 'hard': 200, 'hard-expert': 280, 'expert': 350,
  };
  const base = mode === 'daily' ? baseDaily[input.difficulty] : basePractice[input.difficulty];
  let xp = base;
  if (input.mistakes === 0) xp = Math.round(xp * 1.5);
  if (input.hintsUsed === 0) xp = Math.round(xp * 1.3);
  return xp;
}

/** XP required to reach next level */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.6));
}

/** Total XP needed from level 1 to reach `level` */
export function cumulativeXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

/** Compute current level from total xp */
export function levelFromXp(xp: number): { level: number; xpInLevel: number; xpToNext: number } {
  let level = 1;
  let remaining = xp;
  while (level < 100) {
    const needed = xpForLevel(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }
  return {
    level,
    xpInLevel: remaining,
    xpToNext: level < 100 ? xpForLevel(level) : 0,
  };
}
