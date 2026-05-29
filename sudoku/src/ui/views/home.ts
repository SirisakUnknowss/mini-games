// =====================================================================
// Home view — main hub
// =====================================================================
import { useStore } from '@state/store';
import { todayUtc, formatNumber } from '@lib/format';
import { difficultyForDayOfWeek } from '@engine/generator';
import { levelProgress } from '@lib/level';

export interface HomeViewProps {
  onPlayDaily: () => void;
  onPlayPractice: (level: string) => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenProfile: () => void;
  onAuthAction: () => void;
}

export function mountHomeView(root: HTMLElement, props: HomeViewProps): { unmount: () => void } {
  const state = useStore.getState();
  const today = todayUtc();
  const dow = new Date(today + 'T00:00:00Z').getUTCDay();
  const todayDifficulty = difficultyForDayOfWeek(dow);

  const isAnonymous = !!state.user?.is_anonymous;
  const displayName = state.profile?.display_name || state.profile?.username || (isAnonymous ? 'Guest' : 'Player');
  const equippedEmoji = (state.equipped.avatar?.emoji as string) ?? null;
  const userIcon = equippedEmoji || (isAnonymous ? '👻' : '👤');
  const lvl = levelProgress(state.xp);

  root.innerHTML = `
    <section class="view">
      <div class="header">
        <button class="user-badge" id="user-badge" type="button">
          <span>${userIcon}</span>
          <span>${displayName}</span>
          ${isAnonymous ? '<span class="badge-tag">guest</span>' : ''}
        </button>
        <div style="display:flex;gap:8px;">
          <span class="stat-pill">🔥 ${state.currentStreak}</span>
          <span class="stat-pill">💰 ${formatNumber(state.coins)}</span>
        </div>
      </div>

      <h1>🧩 Sudoku Daily</h1>

      <div class="xp-bar" title="${lvl.xpForNext} XP to level ${lvl.level + 1}">
        <div class="xp-bar-label">
          <span>⭐ Lv ${lvl.level}</span>
          <span>${lvl.xpIntoLevel} / ${lvl.xpIntoLevel + lvl.xpForNext} XP</span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" style="width:${Math.round(lvl.fraction * 100)}%"></div>
        </div>
      </div>

      ${isAnonymous ? `
        <div class="save-banner" id="save-banner">
          <span>💾 Playing as guest — your progress could be lost if you clear data.</span>
          <button class="btn btn--small" id="save-progress">Save progress</button>
        </div>
      ` : ''}

      <div class="card daily-card">
        <h3>📅 Daily Puzzle</h3>
        <div class="daily-date">${today}</div>
        <div class="daily-difficulty">${todayDifficulty}</div>
        <div class="daily-status" id="daily-status">Ready to play!</div>
        <button class="btn btn--full" id="play-daily">Play Daily Puzzle</button>
      </div>

      <div class="card">
        <h3>🎮 Practice Mode</h3>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px;">
          <button class="btn btn--secondary" data-practice="easy">🌱 Easy</button>
          <button class="btn btn--secondary" data-practice="medium">⭐ Medium</button>
          <button class="btn btn--secondary" data-practice="hard">🔥 Hard</button>
          <button class="btn btn--secondary" data-practice="expert">💀 Expert</button>
        </div>
      </div>

      <div class="card">
        <h3>🎯 Daily Quests</h3>
        <div id="quest-list" style="opacity:0.7;">Loading...</div>
      </div>
    </section>
    <nav class="bottom-nav">
      <button class="active"><span class="icon">🏠</span><span>Home</span></button>
      <button id="nav-leaderboard"><span class="icon">🏆</span><span>Leaderboard</span></button>
      <button id="nav-shop"><span class="icon">🛍️</span><span>Shop</span></button>
      <button id="nav-profile"><span class="icon">👤</span><span>Profile</span></button>
    </nav>
  `;

  root.querySelector('#play-daily')?.addEventListener('click', props.onPlayDaily);
  root.querySelectorAll('[data-practice]').forEach(btn => {
    btn.addEventListener('click', () => {
      props.onPlayPractice((btn as HTMLElement).dataset.practice!);
    });
  });
  root.querySelector('#nav-leaderboard')?.addEventListener('click', props.onOpenLeaderboard);
  root.querySelector('#nav-shop')?.addEventListener('click', props.onOpenShop);
  root.querySelector('#nav-profile')?.addEventListener('click', props.onOpenProfile);
  root.querySelector('#user-badge')?.addEventListener('click', props.onAuthAction);
  root.querySelector('#save-progress')?.addEventListener('click', props.onAuthAction);

  return { unmount() { /* no listeners to clean */ } };
}
