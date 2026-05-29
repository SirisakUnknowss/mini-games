// =====================================================================
// Achievements view — grid of locked/unlocked achievements
// =====================================================================
import * as api from '@lib/api';
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

export function mountAchievementsView(root: HTMLElement, props: AchievementsProps): { unmount: () => void } {
  let defs: AchievementDef[] = [];
  let unlocked: Set<string> = new Set();
  let loading = true;
  let errorMsg: string | null = null;
  let activeCategory: string = 'all';

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
      return `
        <div class="ach-card${isUnlocked ? ' unlocked' : ' locked'}">
          <div class="ach-icon" style="--tier-color:${color}">${icon}</div>
          <div class="ach-name">${escapeHtml(d.name)}</div>
          <div class="ach-desc">${escapeHtml(d.description)}</div>
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
      const [defList, userList] = await Promise.all([
        api.getAchievementDefinitions(),
        api.getUserAchievements().catch(() => []),
      ]);
      defs = (defList ?? []) as AchievementDef[];
      unlocked = new Set(((userList ?? []) as UserAchievement[]).map((u) => u.achievement_id));
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
