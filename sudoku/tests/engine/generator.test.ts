import { describe, it, expect } from 'vitest';
import { generatePuzzle, generateDailyPuzzle, difficultyForDayOfWeek, TARGET_CLUES, MIN_CLUES } from '@engine/generator';
import { hasUniqueSolution } from '@engine/solver';
import { isValid, countClues } from '@engine/validator';

describe('generator', () => {
  describe('generatePuzzle', () => {
    it('is deterministic with same seed', () => {
      const a = generatePuzzle({ difficulty: 'medium', seed: 'test-1' });
      const b = generatePuzzle({ difficulty: 'medium', seed: 'test-1' });
      expect(a.puzzle).toEqual(b.puzzle);
      expect(a.solution).toEqual(b.solution);
    });

    it('different seeds → different puzzles', () => {
      const a = generatePuzzle({ difficulty: 'medium', seed: 'test-1' });
      const b = generatePuzzle({ difficulty: 'medium', seed: 'test-2' });
      expect(a.puzzle).not.toEqual(b.puzzle);
    });

    it('all difficulties produce unique solutions', () => {
      const diffs = ['easy', 'medium', 'hard'] as const;
      for (const difficulty of diffs) {
        const { puzzle } = generatePuzzle({ difficulty, seed: `unique-${difficulty}` });
        expect(hasUniqueSolution(puzzle)).toBe(true);
      }
    }, 30_000);

    it('solution is valid Sudoku', () => {
      const { solution } = generatePuzzle({ difficulty: 'easy', seed: 'valid-1' });
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          expect(solution[r][c]).toBeGreaterThanOrEqual(1);
          expect(solution[r][c]).toBeLessThanOrEqual(9);
          expect(isValid(solution, r, c, solution[r][c])).toBe(true);
        }
      }
    });

    it('clue count is within tolerance', () => {
      const { puzzle, difficulty } = generatePuzzle({ difficulty: 'medium', seed: 'clue-1' });
      const clues = countClues(puzzle);
      expect(clues).toBeGreaterThanOrEqual(MIN_CLUES[difficulty]);
      expect(clues).toBeLessThanOrEqual(TARGET_CLUES[difficulty] + 10);
    });
  });

  describe('generateDailyPuzzle', () => {
    it('produces puzzle for date', () => {
      const p = generateDailyPuzzle('2026-05-23');
      expect(p.puzzle).toBeDefined();
      expect(p.solution).toBeDefined();
    });

    it('same date → same puzzle', () => {
      const a = generateDailyPuzzle('2026-05-23');
      const b = generateDailyPuzzle('2026-05-23');
      expect(a.puzzle).toEqual(b.puzzle);
    });
  });

  describe('difficultyForDayOfWeek', () => {
    it('Monday is easy', () => {
      expect(difficultyForDayOfWeek(1)).toBe('easy');
    });
    it('Saturday is hard-expert', () => {
      expect(difficultyForDayOfWeek(6)).toBe('hard-expert');
    });
    it('Sunday is expert', () => {
      expect(difficultyForDayOfWeek(0)).toBe('expert');
    });
  });
});
