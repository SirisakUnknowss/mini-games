// =====================================================================
// Shared bottom-nav — single source of truth for the 4-tab navigation
// =====================================================================
import { sfxNav } from '@lib/sound';

export type NavTab = 'home' | 'leaderboard' | 'shop' | 'profile';

export interface BottomNavCallbacks {
  onHome: () => void;
  onLeaderboard: () => void;
  onShop: () => void;
  onProfile: () => void;
}

function svgHome(s = 22) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>`;
}
function svgRanks(s = 22) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>`;
}
function svgShop(s = 22) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
}
function svgProfile(s = 22) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
}

const TABS: { key: NavTab; icon: (s?: number) => string; label: string }[] = [
  { key: 'home',        icon: svgHome,    label: 'Home'    },
  { key: 'leaderboard', icon: svgRanks,   label: 'Ranks'   },
  { key: 'shop',        icon: svgShop,    label: 'Shop'    },
  { key: 'profile',     icon: svgProfile, label: 'Profile' },
];

export function bottomNavHTML(active: NavTab): string {
  return `
    <nav class="bottom-nav" data-nav>
      ${TABS.map((t) => `
        <button data-nav-tab="${t.key}" class="${t.key === active ? 'active' : ''}">
          <span class="icon">${t.icon(22)}</span>
          <span>${t.label}</span>
        </button>
      `).join('')}
    </nav>
  `;
}

export function wireBottomNav(root: ParentNode, cb: BottomNavCallbacks, active: NavTab): void {
  root.querySelectorAll<HTMLButtonElement>('[data-nav-tab]').forEach((btn) => {
    const tab = btn.dataset.navTab as NavTab;
    if (tab === active) return;
    btn.addEventListener('click', () => {
      sfxNav();
      if (tab === 'home') cb.onHome();
      else if (tab === 'leaderboard') cb.onLeaderboard();
      else if (tab === 'shop') cb.onShop();
      else if (tab === 'profile') cb.onProfile();
    });
  });
}
