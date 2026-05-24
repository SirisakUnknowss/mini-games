import { describe, it, expect } from 'vitest';
import {
  computeDailyScore, computePracticeScore, computeDailyCoinReward,
  xpForLevel, levelFromXp, BASE_SCORE,
} from '@engine/scoring';

describe('scoring', () => {
  describe('computeDailyScore', () => {
    it('perfect speedrun gets bonus', () => {
      const r = computeDailyScore({ difficulty: 'expert', timeSeconds: 300, mistakes: 0, hintsUsed: 0 });
      expect(r.score).toBeGreaterThan(BASE_SCORE.expert);
    });

    it('floor is 100', () => {
      const r = computeDailyScore({ difficulty: 'easy', timeSeconds: 9999, mistakes: 99, hintsUsed: 3 });
      expect(r.score).toBe(100);
    });

    it('mistake reduces score', () => {
      const a = computeDailyScore({ difficulty: 'medium', timeSeconds: 300, mistakes: 0, hintsUsed: 0 });
      const b = computeDailyScore({ difficulty: 'medium', timeSeconds: 300, mistakes: 5, hintsUsed: 0 });
      expect(b.score).toBeLessThan(a.score);
    });
  });

  describe('computePracticeScore', () => {
    it('non-negative', () => {
      expect(computePracticeScore({ difficulty: 'easy', timeSeconds: 1000, mistakes: 50, hintsUsed: 3 })).toBeGreaterThanOrEqual(100);
    });
  });

  describe('computeDailyCoinReward', () => {
    it('expert gives more than easy', () => {
      const easy = computeDailyCoinReward({ difficulty: 'easy', timeSeconds: 100, mistakes: 0, hintsUsed: 0 });
      const expert = computeDailyCoinReward({ difficulty: 'expert', timeSeconds: 100, mistakes: 0, hintsUsed: 0 });
      expect(expert).toBeGreaterThan(easy);
    });

    it('bonus stacks', () => {
      const plain = computeDailyCoinReward({ difficulty: 'medium', timeSeconds: 100, mistakes: 1, hintsUsed: 1 });
      const perfect = computeDailyCoinReward({ difficulty: 'medium', timeSeconds: 100, mistakes: 0, hintsUsed: 0 });
      expect(perfect).toBeGreaterThan(plain);
    });
  });

  describe('xp / level', () => {
    it('xpForLevel grows', () => {
      expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(1));
      expect(xpForLevel(50)).toBeGreaterThan(xpForLevel(10));
    });

    it('levelFromXp at 0 is level 1', () => {
      expect(levelFromXp(0).level).toBe(1);
    });

    it('levelFromXp accumulates correctly', () => {
      const xp = xpForLevel(1) + xpForLevel(2) + 10;
      expect(levelFromXp(xp).level).toBe(3);
    });
  });
});
