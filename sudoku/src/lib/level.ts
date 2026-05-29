// =====================================================================
// XP / Level curve — quadratic so it scales smoothly forever
// xpForLevel(L) = total xp required to BE level L (lvl 1 starts at 0)
//   threshold(L) = (L - 1) * L * 50
//   1 → 0, 2 → 100, 3 → 300, 4 → 600, 5 → 1000, ...
// =====================================================================

export function xpForLevel(level: number): number {
  const L = Math.max(1, level);
  return (L - 1) * L * 50;
}

/** Returns the current level (>= 1) given total accumulated xp. */
export function levelFromXp(totalXp: number): number {
  const xp = Math.max(0, totalXp);
  let lvl = 1;
  while (xpForLevel(lvl + 1) <= xp) lvl += 1;
  return lvl;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNext: number;
  fraction: number;
}

export function levelProgress(totalXp: number): LevelProgress {
  const level = levelFromXp(totalXp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = Math.max(1, ceil - floor);
  const into = Math.max(0, totalXp - floor);
  return {
    level,
    xpIntoLevel: into,
    xpForNext: ceil - totalXp,
    fraction: Math.min(1, into / span),
  };
}
