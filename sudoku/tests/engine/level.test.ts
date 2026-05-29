// =====================================================================
// Tests for src/lib/level.ts — XP curve invariants
// =====================================================================
import { describe, it, expect } from 'vitest';
import { xpForLevel, levelFromXp, levelProgress } from '../../src/lib/level';

describe('xpForLevel', () => {
  it('is monotonically increasing', () => {
    for (let lvl = 1; lvl < 100; lvl++) {
      expect(xpForLevel(lvl + 1)).toBeGreaterThan(xpForLevel(lvl));
    }
  });
  it('level 1 threshold is 0 (starts here)', () => {
    expect(xpForLevel(1)).toBe(0);
  });
  it('level 2 threshold is 100 (1*2*50)', () => {
    expect(xpForLevel(2)).toBe(100);
  });
});

describe('levelFromXp', () => {
  it('returns 1 at 0 xp', () => {
    expect(levelFromXp(0)).toBe(1);
  });
  it('snaps to the correct level at boundaries', () => {
    expect(levelFromXp(xpForLevel(1))).toBe(1);
    expect(levelFromXp(xpForLevel(2))).toBe(2);
    expect(levelFromXp(xpForLevel(5))).toBe(5);
  });
  it('does not skip levels for typical xp values', () => {
    for (let xp = 0; xp < 100000; xp += 500) {
      const lvl = levelFromXp(xp);
      expect(xpForLevel(lvl)).toBeLessThanOrEqual(xp);
      expect(xpForLevel(lvl + 1)).toBeGreaterThan(xp);
    }
  });
});

describe('levelProgress', () => {
  it('fraction is between 0 and 1', () => {
    for (const xp of [0, 50, 100, 500, 1000, 5000, 50000]) {
      const p = levelProgress(xp);
      expect(p.fraction).toBeGreaterThanOrEqual(0);
      expect(p.fraction).toBeLessThanOrEqual(1);
    }
  });
  it('xpForNext is positive', () => {
    const p = levelProgress(150);
    expect(p.xpForNext).toBeGreaterThan(0);
  });
});
