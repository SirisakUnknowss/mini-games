// =====================================================================
// Achievements view — grid of locked/unlocked achievements
// =====================================================================
import * as api from '@lib/api';
import { supabase } from '@lib/supabase';
import { useStore } from '@state/store';
import { escapeHtml } from '@lib/format';

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  tier: string;
  category: string;
  reward_coin: number;
  reward_xp: number;
  hidden: boolean;
  icon: string | null;
  sort_order: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

const TIER_COLOR: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

export interface AchievementsProps {
  onBack: () => void;
}

interface ProgressInputs {
  gameCount: number;
  dailyCount: number;
  perfectCount: number;
  currentStreak: number;
  level: number;
  coins: number;
  themesOwned: number;
}

// Compute partial progress toward countable achievements.
// Returns { progress, target } or null if not progress-trackable client-side.
function computeProgress(id: string, i: ProgressInputs): { progress: number; target: number } | null {
  const COUNTERS: Record<string, [keyof ProgressInputs, number]> = {
    // play_volume
    ACH_PLAY_10:        ['gameCount',    10],
    ACH_PLAY_50:        ['gameCount',    50],
    ACH_PLAY_100:       ['gameCount',   100],
    ACH_PLAY_500:       ['gameCount',   500],
    ACH_PLAY_1000:      ['gameCount',  1000],
    ACH_PLAY_5000:      ['gameCount',  5000],

    // daily volume
    ACH_DAILY_10:       ['dailyCount',   10],
    ACH_DAILY_50:       ['dailyCount',   50],

    // streak
    ACH_STREAK_3:       ['currentStreak',   3],
    ACH_STREAK_7:       ['currentStreak',   7],
    ACH_STREAK_14:      ['currentStreak',  14],
    ACH_STREAK_30:      ['currentStreak',  30],
    ACH_STREAK_60:      ['currentStreak',  60],
    ACH_STREAK_100:     ['currentStreak', 100],
    ACH_STREAK_365:     ['currentStreak', 365],

    // skill (perfect runs)
    ACH_PERFECT_5:      ['perfectCount',   5],
    ACH_PERFECT_25:     ['perfectCount',  25],

    // level
    ACH_LEVEL_10:       ['level',  10],
    ACH_LEVEL_25:       ['level',  25],
    ACH_LEVEL_50:       ['level',  50],
    ACH_LEVEL_100:      ['level', 100],

    // special
    ACH_RICH:           ['coins',         10000],
    ACH_THEME_COLLECT:  ['themesOwned',       5],
  };
  const entry = COUNTERS[id];
  if (!entry) return null;
  const [field, target] = entry;
  const progress = Math.min(i[field] as number, target);
  return { progress, target };
}

export function mountAchievementsView(root: HTMLElement, props: AchievementsProps): { unmount: () => void } {
  let defs: AchievementDef[] = [];
  let unlocked: Set<string> = new Set();
  let loading = true;
  let errorMsg: string | null = null;
  let activeCategory: string = 'all';
  let progressInputs: ProgressInputs = {
    gameCount: 0,
    dailyCount: 0,
    perfectCount: 0,
    currentStreak: 0,
    level: 1,
    coins: 0,
    themesOwned: 0,
  };

  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="ach-back" aria-label="Back">‹</button>
        <h2 style="margin:0;">🏆 Achievements</h2>
        <span class="stat-pill" id="ach-count">0/0</span>
      </div>
      <div class="shop-tabs" id="ach-tabs"></div>
      <div class="ach-grid" id="ach-grid"></div>
    </section>
    <nav class="bottom-nav">
      <button id="ach-nav-home"><span class="icon">🏠</span><span>Home</span></button>
      <button id="ach-nav-lb"><span class="icon">🏆</span><span>Leaderboard</span></button>
      <button id="ach-nav-shop"><span class="icon">🛍️</span><span>Shop</span></button>
      <button class="active" id="ach-nav-profile"><span class="icon">👤</span><span>Profile</span></button>
    </nav>
  `;

  const gridEl = root.querySelector<HTMLElement>('#ach-grid')!;
  const tabsEl = root.querySelector<HTMLElement>('#ach-tabs')!;
  const countEl = root.querySelector<HTMLElement>('#ach-count')!;

  function render() {
    if (loading) {
      gridEl.innerHTML = `<div class="shop-loading">Loading achievements…</div>`;
      return;
    }
    if (errorMsg) {
      gridEl.innerHTML = `<div class="lb-empty"><p>⚠️ ${escapeHtml(errorMsg)}</p></div>`;
      return;
    }

    const categories = Array.from(new Set(defs.map((d) => d.category)));
    tabsEl.innerHTML = `
      <button class="shop-tab${activeCategory === 'all' ? ' active' : ''}" data-cat="all">All</button>
      ${categories.map((c) => `
        <button class="shop-tab${activeCategory === c ? ' active' : ''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>
      `).join('')}
    `;
    tabsEl.querySelectorAll<HTMLButtonElement>('.shop-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat!;
        render();
      });
    });

    const filtered = activeCategory === 'all'
      ? defs
      : defs.filter((d) => d.category === activeCategory);
    const visible = filtered.filter((d) => !d.hidden || unlocked.has(d.id));

    countEl.textContent = `${unlocked.size}/${defs.length}`;

    if (!visible.length) {
      gridEl.innerHTML = `<div class="lb-empty"><p>🫥 No achievements in this category.</p></div>`;
      return;
    }

    gridEl.innerHTML = visible.map((d) => {
      const isUnlocked = unlocked.has(d.id);
      const tier = d.tier ?? 'bronze';
      const color = TIER_COLOR[tier] ?? '#cd7f32';
      const icon = d.icon || (isUnlocked ? '🏆' : '🔒');
      const prog = !isUnlocked && computeProgress(d.id, progressInputs);
      return `
        <div class="ach-card${isUnlocked ? ' unlocked' : ' locked'}">
          <div class="ach-icon" style="--tier-color:${color}">${icon}</div>
          <div class="ach-name">${escapeHtml(d.name)}</div>
          <div class="ach-desc">${escapeHtml(d.description)}</div>
          ${prog ? `
            <div class="quest-bar" style="width:100%;margin-top:4px;">
              <div class="quest-bar-fill" style="width:${(prog.progress / prog.target) * 100}%"></div>
            </div>
            <div style="font-size:10px;opacity:0.8;">${prog.progress} / ${prog.target}</div>
          ` : ''}
          <div class="ach-tier" style="background:${color};color:#1a1a2e;">${escapeHtml(tier)}</div>
          ${d.reward_coin || d.reward_xp ? `
            <div class="ach-rewards">
              ${d.reward_coin ? `<span>💰 ${d.reward_coin}</span>` : ''}
              ${d.reward_xp ? `<span>⭐ ${d.reward_xp}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  async function load() {
    loading = true; errorMsg = null; render();
    try {
      const state = useStore.getState();
      const userId = state.user?.id;
      const [defList, userList, history, daily, perfect, inventory] = await Promise.all([
        api.getAchievementDefinitions(),
        api.getUserAchievements().catch(() => []),
        userId
          ? supabase.from('user_game_history').select('id', { count: 'exact', head: true }).eq('user_id', userId)
          : Promise.resolve({ count: 0 } as any),
        userId
          ? supabase.from('user_game_history').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('mode', 'daily')
          : Promise.resolve({ count: 0 } as any),
        userId
          ? supabase.from('user_game_history').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('mistakes', 0)
          : Promise.resolve({ count: 0 } as any),
        api.getInventory().catch(() => []),
      ]);
      defs = (defList ?? []) as AchievementDef[];
      unlocked = new Set(((userList ?? []) as UserAchievement[]).map((u) => u.achievement_id));
      const ownedIds = ((inventory ?? []) as any[]).map((r) => r.item_id as string);
      progressInputs = {
        gameCount:     (history as any)?.count ?? 0,
        dailyCount:    (daily as any)?.count ?? 0,
        perfectCount:  (perfect as any)?.count ?? 0,
        currentStreak: state.currentStreak,
        level:         state.level,
        coins:         state.coins,
        themesOwned:   ownedIds.filter((id) => id.startsWith('theme_')).length,
      };
      loading = false;
      render();
    } catch (err) {
      loading = false;
      errorMsg = (err as Error).message ?? 'Could not load achievements.';
      render();
    }
  }

  root.querySelector('#ach-back')?.addEventListener('click', props.onBack);
  root.querySelector('#ach-nav-home')?.addEventListener('click', props.onBack);
  root.querySelector('#ach-nav-profile')?.addEventListener('click', props.onBack);

  void load();

  return { unmount() { /* no-op */ } };
}
