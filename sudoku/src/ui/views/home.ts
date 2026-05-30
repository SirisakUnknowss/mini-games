// =====================================================================
// Home view — main hub
// =====================================================================
import { useStore } from '@state/store';
import { todayUtc, formatNumber } from '@lib/format';
import { difficultyForDayOfWeek } from '@engine/generator';
import { levelProgress } from '@lib/level';
import { bottomNavHTML, wireBottomNav, type BottomNavCallbacks } from '../components/bottom-nav';

export interface HomeViewProps {
  onPlayDaily: () => void;
  onPlayPractice: (level: string) => void;
  onAuthAction: () => void;
  nav: BottomNavCallbacks;
}

export function mountHomeView(root: HTMLElement, props: HomeViewProps): { unmount: () => void } {
  const state = useStore.getState();
  const today = todayUtc();
  const dow = new Date(today + 'T00:00:00Z').getUTCDay();
  const todayDifficulty = difficultyForDayOfWeek(dow);

  const isAnonymous = !!state.user?.is_anonymous;
  const isGuest = !state.user || isAnonymous;
  const displayName = state.profile?.display_name || state.profile?.username || (isGuest ? 'Guest' : 'Player');
  const equippedEmoji = (state.equipped.avatar?.emoji as string) ?? null;
  const userIcon = equippedEmoji || (isGuest ? '👻' : '👤');
  const lvl = levelProgress(state.xp);

  root.innerHTML = `
    <section class="view view--home">
      <div class="header">
        <button class="user-badge" id="user-badge" type="button">
          <span>${userIcon}</span>
          <span>${displayName}</span>
          ${isAnonymous ? '<span class="badge-tag">guest</span>' : ''}
        </button>
        <div style="display:flex;gap:6px;">
          <span class="stat-pill">🔥 ${state.currentStreak}</span>
          <span class="stat-pill">💰 ${formatNumber(state.coins)}</span>
        </div>
      </div>

      <div class="xp-bar" title="${lvl.xpForNext} XP to level ${lvl.level + 1}">
        <div class="xp-bar-label">
          <span>⭐ Lv ${lvl.level}</span>
          <span>${lvl.xpIntoLevel} / ${lvl.xpIntoLevel + lvl.xpForNext} XP</span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" style="width:${Math.round(lvl.fraction * 100)}%"></div>
        </div>
      </div>

      ${isGuest ? `
        <div class="save-banner save-banner--compact" id="save-banner">
          <span>💾 Guest mode</span>
          <button class="btn btn--small" id="save-progress">Save</button>
        </div>
      ` : ''}

      <div class="card daily-card">
        <div class="daily-head">
          <h3>📅 Daily Puzzle</h3>
          <span class="daily-difficulty">${todayDifficulty}</span>
        </div>
        <div class="daily-date" id="daily-status">${today} · Ready to play!</div>
        <button class="btn btn--full" id="play-daily">▶ Play Daily</button>
      </div>

      <div class="card practice-card">
        <h3>🎮 Practice</h3>
        <div class="practice-grid">
          <button class="btn btn--secondary practice-btn" data-practice="easy">🌱<span>Easy</span></button>
          <button class="btn btn--secondary practice-btn" data-practice="medium">⭐<span>Medium</span></button>
          <button class="btn btn--secondary practice-btn" data-practice="hard">🔥<span>Hard</span></button>
          <button class="btn btn--secondary practice-btn" data-practice="expert">💀<span>Expert</span></button>
        </div>
      </div>

      <div class="card quests-card">
        <h3>🎯 Quests</h3>
        <div id="quest-list" style="opacity:0.7;font-size:13px;">Loading…</div>
      </div>
    </section>
    ${bottomNavHTML('home')}
  `;

  root.querySelector('#play-daily')?.addEventListener('click', props.onPlayDaily);
  root.querySelectorAll('[data-practice]').forEach(btn => {
    btn.addEventListener('click', () => {
      props.onPlayPractice((btn as HTMLElement).dataset.practice!);
    });
  });
  wireBottomNav(root, props.nav, 'home');
  root.querySelector('#user-badge')?.addEventListener('click', props.onAuthAction);
  root.querySelector('#save-progress')?.addEventListener('click', props.onAuthAction);

  return { unmount() { /* no listeners to clean */ } };
}
