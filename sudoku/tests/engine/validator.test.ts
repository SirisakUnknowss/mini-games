import { describe, it, expect } from 'vitest';
import {
  isValid, boardsEqual, cloneBoard,
  emptyBoard, serialize, parse, countClues,
} from '@engine/validator';

describe('validator', () => {
  describe('isValid', () => {
    it('accepts unique placement', () => {
      const b = emptyBoard();
      expect(isValid(b, 0, 0, 5)).toBe(true);
    });

    it('rejects row duplicate', () => {
      const b = emptyBoard();
      b[0][3] = 5;
      expect(isValid(b, 0, 0, 5)).toBe(false);
    });

    it('rejects column duplicate', () => {
      const b = emptyBoard();
      b[4][2] = 7;
      expect(isValid(b, 0, 2, 7)).toBe(false);
    });

    it('rejects box duplicate', () => {
      const b = emptyBoard();
      b[1][1] = 3;
      expect(isValid(b, 0, 0, 3)).toBe(false);
    });

    it('ignores self', () => {
      const b = emptyBoard();
      b[0][0] = 5;
      expect(isValid(b, 0, 0, 5)).toBe(true);
    });
  });

  describe('serialize/parse', () => {
    it('roundtrips', () => {
      const b = emptyBoard();
      b[0][0] = 5; b[4][4] = 9; b[8][8] = 1;
      const s = serialize(b);
      expect(s.length).toBe(81);
      expect(parse(s)).toEqual(b);
    });

    it('throws on wrong length', () => {
      expect(() => parse('123')).toThrow();
    });
  });

  describe('countClues', () => {
    it('counts non-zero cells', () => {
      const b = emptyBoard();
      b[0][0] = 1; b[1][1] = 2; b[2][2] = 3;
      expect(countClues(b)).toBe(3);
    });
  });

  describe('boardsEqual', () => {
    it('true for identical', () => {
      const a = emptyBoard();
      const b = emptyBoard();
      a[0][0] = 5; b[0][0] = 5;
      expect(boardsEqual(a, b)).toBe(true);
    });

    it('false for different', () => {
      const a = emptyBoard();
      const b = emptyBoard();
      a[0][0] = 5;
      expect(boardsEqual(a, b)).toBe(false);
    });
  });

  describe('cloneBoard', () => {
    it('produces deep copy', () => {
      const a = emptyBoard();
      a[0][0] = 5;
      const b = cloneBoard(a);
      b[0][0] = 9;
      expect(a[0][0]).toBe(5);
    });
  });
});
