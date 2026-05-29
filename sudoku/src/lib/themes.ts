// =====================================================================
// Theme system — applies a set of CSS custom properties on <html>
// Themes correspond to shop_items where category='theme'
// =====================================================================

export interface ThemeTokens {
  '--brand-primary': string;
  '--brand-secondary': string;
  '--brand-gradient': string;
  '--cell-bg': string;
  '--cell-bg-given': string;
  '--cell-bg-selected': string;
  '--cell-bg-related': string;
  '--cell-bg-same': string;
  '--cell-bg-conflict': string;
  '--cell-text': string;
  '--cell-text-user': string;
  '--cell-text-hint': string;
  '--cell-text-conflict': string;
  '--border-thick': string;
  '--border-thin': string;
}

export interface ThemeMeta {
  id: string;
  name: string;
  preview: string; // emoji shown in shop card
  tokens: Partial<ThemeTokens>;
}

const CLASSIC: Partial<ThemeTokens> = {
  '--brand-primary': '#667eea',
  '--brand-secondary': '#764ba2',
  '--brand-gradient': 'linear-gradient(135deg, #667eea, #764ba2)',
  '--cell-bg': '#ffffff',
  '--cell-bg-given': '#f5f5f5',
  '--cell-bg-selected': '#bbdefb',
  '--cell-bg-related': '#e3f2fd',
  '--cell-bg-same': '#c5cae9',
  '--cell-bg-conflict': '#ffebee',
  '--cell-text': '#1a1a2e',
  '--cell-text-user': '#1976d2',
  '--cell-text-hint': '#43a047',
  '--cell-text-conflict': '#e53935',
  '--border-thick': '#1a1a2e',
  '--border-thin': '#dddddd',
};

export const THEMES: Record<string, ThemeMeta> = {
  theme_classic: {
    id: 'theme_classic', name: 'Classic', preview: '💎',
    tokens: CLASSIC,
  },
  theme_paper: {
    id: 'theme_paper', name: 'Paper', preview: '📜',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #f4e3c1, #d7b88f)',
      '--cell-bg': '#fef9ef',
      '--cell-bg-given': '#f0e3c8',
      '--cell-text': '#3b2a1a',
      '--cell-text-user': '#a0522d',
    },
  },
  theme_dark: {
    id: 'theme_dark', name: 'Dark Mode', preview: '🌙',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #1a1a2e, #16213e)',
      '--cell-bg': '#222244',
      '--cell-bg-given': '#1a1a2e',
      '--cell-bg-selected': '#3949ab',
      '--cell-bg-related': '#2c2c54',
      '--cell-bg-same': '#283593',
      '--cell-text': '#e0e0e0',
      '--cell-text-user': '#82b1ff',
      '--cell-text-hint': '#69f0ae',
      '--border-thick': '#0a0a18',
      '--border-thin': '#3a3a5a',
    },
  },
  theme_pastel: {
    id: 'theme_pastel', name: 'Pastel Dream', preview: '🌸',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #ffd6e8, #d6e8ff)',
      '--cell-bg': '#fff5fa',
      '--cell-bg-selected': '#ffd6e8',
      '--cell-bg-related': '#ffe6f0',
      '--cell-text': '#4a2a4a',
      '--cell-text-user': '#c2185b',
    },
  },
  theme_ocean: {
    id: 'theme_ocean', name: 'Ocean', preview: '🌊',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #2196f3, #006064)',
      '--cell-bg': '#e1f5fe',
      '--cell-bg-selected': '#81d4fa',
      '--cell-text': '#01579b',
      '--cell-text-user': '#0288d1',
    },
  },
  theme_forest: {
    id: 'theme_forest', name: 'Forest', preview: '🌲',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #66bb6a, #1b5e20)',
      '--cell-bg': '#f1f8e9',
      '--cell-bg-selected': '#aed581',
      '--cell-text': '#1b5e20',
      '--cell-text-user': '#388e3c',
    },
  },
  theme_sunset: {
    id: 'theme_sunset', name: 'Sunset', preview: '🌅',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #ff7043, #ab47bc)',
      '--cell-bg': '#fff3e0',
      '--cell-bg-selected': '#ffcc80',
      '--cell-text': '#4a148c',
      '--cell-text-user': '#e64a19',
    },
  },
  theme_neon: {
    id: 'theme_neon', name: 'Neon Night', preview: '⚡',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      '--cell-bg': '#1a1140',
      '--cell-bg-given': '#0f0c29',
      '--cell-bg-selected': '#ff00ff',
      '--cell-bg-related': '#3a2470',
      '--cell-text': '#00ffff',
      '--cell-text-user': '#ff00ff',
      '--cell-text-hint': '#39ff14',
      '--border-thick': '#000000',
      '--border-thin': '#5a3aa0',
    },
  },
  theme_sakura: {
    id: 'theme_sakura', name: 'Sakura', preview: '🌸',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #ffb7c5, #d76d8e)',
      '--cell-bg': '#fff0f5',
      '--cell-bg-selected': '#ffb7c5',
      '--cell-text': '#880e4f',
      '--cell-text-user': '#ad1457',
    },
  },
  theme_thai: {
    id: 'theme_thai', name: 'Thai Heritage', preview: '🇹🇭',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #b71c1c, #ffc107)',
      '--cell-bg': '#fff8e1',
      '--cell-bg-given': '#fff3c4',
      '--cell-text': '#3e2723',
      '--cell-text-user': '#b71c1c',
    },
  },
  theme_mono: {
    id: 'theme_mono', name: 'Mono Pro', preview: '⬛',
    tokens: {
      '--brand-gradient': 'linear-gradient(135deg, #424242, #000000)',
      '--cell-bg': '#fafafa',
      '--cell-bg-given': '#eeeeee',
      '--cell-bg-selected': '#bdbdbd',
      '--cell-text': '#000000',
      '--cell-text-user': '#212121',
      '--cell-text-hint': '#616161',
    },
  },
};

const ACTIVE_THEME_KEY = 'sudoku_active_theme_v1';

export function applyTheme(themeId: string | null | undefined): void {
  const id = themeId || 'theme_classic';
  const theme = THEMES[id] ?? THEMES['theme_classic'];
  const root = document.documentElement;

  // Reset to classic first to clear any leftover overrides
  for (const [k, v] of Object.entries(CLASSIC)) {
    root.style.setProperty(k, v as string);
  }
  // Apply overrides
  for (const [k, v] of Object.entries(theme.tokens)) {
    root.style.setProperty(k, v as string);
  }
  try { localStorage.setItem(ACTIVE_THEME_KEY, id); } catch { /* private */ }
}

export function loadCachedThemeId(): string | null {
  try { return localStorage.getItem(ACTIVE_THEME_KEY); } catch { return null; }
}

export function themePreview(themeId: string): string {
  return THEMES[themeId]?.preview ?? '🎨';
}
