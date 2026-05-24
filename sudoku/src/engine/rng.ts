// =====================================================================
// Seeded RNG (LCG) — deterministic random number generator
// Same seed → same sequence forever
// =====================================================================

export type Rng = () => number;

/**
 * Linear Congruential Generator.
 * Parameters from Numerical Recipes.
 */
export function seededRng(seed: number): Rng {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Hash a string to a 32-bit integer (FNV-1a) */
export function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** Fisher-Yates shuffle (immutable, uses RNG) */
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
