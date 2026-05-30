// =====================================================================
// Premium gating — single source of truth for "is this user premium?"
// For now: localStorage flag (set when paywall stub succeeds in future).
// =====================================================================

const PREMIUM_KEY = 'sudoku_premium_v1';

/** Item ids considered "premium-only" (free for premium users, locked otherwise). */
export const PREMIUM_THEMES = new Set([
  'theme_sakura',
  'theme_thai',
  'theme_mono',
]);

export function isPremium(): boolean {
  try { return localStorage.getItem(PREMIUM_KEY) === '1'; }
  catch { return false; }
}

export function setPremium(active: boolean): void {
  try {
    if (active) localStorage.setItem(PREMIUM_KEY, '1');
    else localStorage.removeItem(PREMIUM_KEY);
  } catch { /* private mode */ }
}

/**
 * Returns true if the user is allowed to use this themed item (owned or premium).
 * `owned` is whether the item id is in the user's inventory.
 */
export function canUsePremiumItem(itemId: string, owned: boolean): boolean {
  if (owned) return true;
  if (PREMIUM_THEMES.has(itemId) && isPremium()) return true;
  return false;
}
