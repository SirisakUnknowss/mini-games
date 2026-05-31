// =====================================================================
// Shared bottom-nav — single source of truth for the 4-tab navigation
// =====================================================================
import { escapeHtml } from '@lib/format';
import { sfxNav } from '@lib/sound';

export type NavTab = 'home' | 'leaderboard' | 'shop' | 'profile';

export interface BottomNavCallbacks {
  onHome: () => void;
  onLeaderboard: () => void;
  onShop: () => void;
  onProfile: () => void;
}

const TABS: { key: NavTab; icon: string; label: string }[] = [
  { key: 'home',        icon: '🏠',   label: 'Home' },
  { key: 'leaderboard', icon: '🏆',   label: 'Ranks' },
  { key: 'shop',        icon: '🛍️',  label: 'Shop' },
  { key: 'profile',     icon: '👤',   label: 'Profile' },
];

/** Returns the HTML string for the bottom nav with `active` set correctly. */
export function bottomNavHTML(active: NavTab): string {
  return `
    <nav class="bottom-nav" data-nav>
      ${TABS.map((t) => `
        <button data-nav-tab="${t.key}" class="${t.key === active ? 'active' : ''}">
          <span class="icon">${t.icon}</span><span>${escapeHtml(t.label)}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

/** Wires the bottom-nav buttons inside `root` to the provided callbacks. */
export function wireBottomNav(root: ParentNode, cb: BottomNavCallbacks, active: NavTab): void {
  root.querySelectorAll<HTMLButtonElement>('[data-nav-tab]').forEach((btn) => {
    const tab = btn.dataset.navTab as NavTab;
    if (tab === active) return; // no-op on the current tab
    btn.addEventListener('click', () => {
      sfxNav();
      if (tab === 'home') cb.onHome();
      else if (tab === 'leaderboard') cb.onLeaderboard();
      else if (tab === 'shop') cb.onShop();
      else if (tab === 'profile') cb.onProfile();
    });
  });
}
