// =====================================================================
// Background system — applies a body class for the equipped background.
// Animated backgrounds are CSS-only (rain / waves / particles).
// =====================================================================

export interface BackgroundMeta {
  id: string;
  name: string;
  /** className applied to <body>. CSS in main.css handles the look. */
  className: string;
  /** Optional CSS gradient/color used as a static fallback. */
  fallback?: string;
}

export const BACKGROUNDS: Record<string, BackgroundMeta> = {
  bg_default:        { id: 'bg_default',        name: 'Default Gradient',  className: 'bg-default' },
  bg_blank_white:    { id: 'bg_blank_white',    name: 'Blank White',       className: 'bg-blank-white' },
  bg_solid_navy:     { id: 'bg_solid_navy',     name: 'Navy Solid',        className: 'bg-solid-navy' },
  bg_solid_forest:   { id: 'bg_solid_forest',   name: 'Forest Solid',      className: 'bg-solid-forest' },
  bg_pattern_dots:   { id: 'bg_pattern_dots',   name: 'Dot Pattern',       className: 'bg-pattern-dots' },
  bg_pattern_waves:  { id: 'bg_pattern_waves',  name: 'Wavy Pattern',      className: 'bg-pattern-waves' },
  bg_anim_rain:      { id: 'bg_anim_rain',      name: 'Animated Rain',     className: 'bg-anim-rain' },
  bg_anim_stars:     { id: 'bg_anim_stars',     name: 'Animated Stars',    className: 'bg-anim-stars' },
  bg_anim_aurora:    { id: 'bg_anim_aurora',    name: 'Aurora Borealis',   className: 'bg-anim-aurora' },
};

const BG_CLASSES = Object.values(BACKGROUNDS).map((b) => b.className);
const ACTIVE_BG_KEY = 'sudoku_active_bg_v1';

export function applyBackground(bgId: string | null | undefined): void {
  const id = bgId || 'bg_default';
  const meta = BACKGROUNDS[id] ?? BACKGROUNDS['bg_default'];
  const body = document.body;
  for (const cls of BG_CLASSES) body.classList.remove(cls);
  body.classList.add(meta.className);
  try { localStorage.setItem(ACTIVE_BG_KEY, id); } catch { /* private */ }
}

export function loadCachedBgId(): string | null {
  try { return localStorage.getItem(ACTIVE_BG_KEY); } catch { return null; }
}

export function bgPreviewIcon(id: string): string {
  if (id.includes('anim_rain')) return '🌧';
  if (id.includes('anim_stars')) return '✨';
  if (id.includes('anim_aurora')) return '🌌';
  if (id.includes('pattern_dots')) return '⚬';
  if (id.includes('pattern_waves')) return '〰️';
  if (id.includes('navy')) return '🌃';
  if (id.includes('forest')) return '🌲';
  if (id.includes('blank')) return '⬜';
  return '🖼';
}
