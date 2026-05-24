import { describe, it, expect } from 'vitest';
import { countSolutions, hasUniqueSolution, solve } from '@engine/solver';
import { parse } from '@engine/validator';

const UNIQUE_PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
const UNIQUE_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

/**
 * Highly under-constrained puzzle: only row 0 filled with 1-9 in order.
 * The remaining 72 cells admit many valid completions.
 */
const AMBIGUOUS_PUZZLE = '123456789' + '0'.repeat(72);

describe('solver', () => {
  describe('countSolutions', () => {
    it('finds 1 for a unique puzzle', () => {
      const puzzle = parse(UNIQUE_PUZZLE);
      expect(countSolutions(puzzle, 2)).toBe(1);
    });

    it('finds multiple for ambiguous puzzle', () => {
      // 4 erased cells form a "deadly rectangle" → 2 solutions
      const puzzle = parse(AMBIGUOUS_PUZZLE);
      expect(countSolutions(puzzle, 2)).toBe(2);
    });

    it('respects cap=1', () => {
      const puzzle = parse(AMBIGUOUS_PUZZLE);
      expect(countSolutions(puzzle, 1)).toBe(1);
    });
  });

  describe('hasUniqueSolution', () => {
    it('true for unique', () => {
      expect(hasUniqueSolution(parse(UNIQUE_PUZZLE))).toBe(true);
    });

    it('false for ambiguous', () => {
      expect(hasUniqueSolution(parse(AMBIGUOUS_PUZZLE))).toBe(false);
    });
  });

  describe('solve', () => {
    it('solves known puzzle correctly', () => {
      const puzzle = parse(UNIQUE_PUZZLE);
      const expected = parse(UNIQUE_SOLUTION);
      expect(solve(puzzle)).toEqual(expected);
    });

    it('returns null for unsolvable', () => {
      // Real unsolvable: cell (0,2) requires a value but no value works
      // because row/col/box are saturated against every candidate.
      // Construct by filling row 0 with 1..8 then expecting (0,8)=9, but
      // also place 9 in column 8 to force conflict.
      const bad = parse(
        '12345678' + '0' +    // row 0: 1,2,3,4,5,6,7,8,_
        '0'.repeat(8) + '9' + // row 1: _,_,_,_,_,_,_,_,9
        '0'.repeat(63)
      );
      expect(solve(bad)).toBeNull();
    });
  });
});
