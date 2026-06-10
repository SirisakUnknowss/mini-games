// =====================================================================
// Home view — main hub
// =====================================================================
import { useStore } from '@state/store';
import { todayUtc, formatNumber } from '@lib/format';
import { difficultyForDayOfWeek } from '@engine/generator';
import { levelProgress } from '@lib/level';
import { bottomNavHTML, wireBottomNav, type BottomNavCallbacks } from '../components/bottom-nav';
import { isMuted, toggleMute } from '@lib/sound';
import { useVisitorStore } from '@state/visitor-store';
import { getGuestDisplayId } from '@lib/api';

export interface HomeViewProps {
  onPlayDaily: () => void;
  onPlayPractice: (level: string) => void;
  onAuthAction: () => void;
  nav: BottomNavCallbacks;
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function mountHomeView(root: HTMLElement, props: HomeViewProps): { unmount: () => void } {
  const state = useStore.getState();
  const today = todayUtc();
  const dow = new Date(today + 'T00:00:00Z').getUTCDay();
  const todayDifficulty = difficultyForDayOfWeek(dow);

  const visitorStats = useVisitorStore.getState();
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
        <div style="display:flex;gap:6px;align-items:center;">
          <span class="stat-pill">🔥 ${state.currentStreak}</span>
          <span class="stat-pill">💰 ${formatNumber(state.coins)}</span>
          <button class="mute-btn" id="mute-btn" title="${isMuted() ? 'Unmute' : 'Mute'}">${isMuted() ? '🔇' : '🔊'}</button>
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
          <span>💾 Guest <span class="guest-id-chip">${getGuestDisplayId()}</span></span>
          <button class="btn btn--small" id="save-progress">Save progress</button>
        </div>
      ` : ''}

      <!-- Live Stats Widget -->
      <div class="card live-stats-card">
        <div class="live-stats-header">
          <span class="live-dot-wrap"><span class="live-dot"></span>LIVE</span>
          <span class="live-stats-title">Community</span>
        </div>
        <div class="live-stats-grid">
          <div class="ls-block ls-block--online">
            <div class="ls-value"><span id="vs-online">${visitorStats.loaded ? fmtCount(visitorStats.online) : '—'}</span></div>
            <div class="ls-label">online now</div>
            <div class="ls-sub">
              <span>👻 <span id="vs-online-guests">${visitorStats.loaded ? fmtCount(visitorStats.online_guests) : '—'}</span> guest</span>
              <span>✉️ <span id="vs-online-members">${visitorStats.loaded ? fmtCount(visitorStats.online_members) : '—'}</span> member</span>
            </div>
          </div>
          <div class="ls-divider"></div>
          <div class="ls-block">
            <div class="ls-value"><span id="vs-today">${visitorStats.loaded ? fmtCount(visitorStats.today) : '—'}</span></div>
            <div class="ls-label">today</div>
            <div class="ls-sub">
              <span>👻 <span id="vs-today-guests">${visitorStats.loaded ? fmtCount(visitorStats.today_guests) : '—'}</span></span>
              <span>✉️ <span id="vs-today-members">${visitorStats.loaded ? fmtCount(visitorStats.today_members) : '—'}</span></span>
            </div>
          </div>
          <div class="ls-divider"></div>
          <div class="ls-block">
            <div class="ls-value"><span id="vs-total">${visitorStats.loaded ? fmtCount(visitorStats.total) : '—'}</span></div>
            <div class="ls-label">all time</div>
            <div class="ls-sub"><span>unique visitors</span></div>
          </div>
        </div>
      </div>

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
  root.querySelector('#mute-btn')?.addEventListener('click', (e) => {
    const muted = toggleMute();
    const btn = e.currentTarget as HTMLButtonElement;
    btn.textContent = muted ? '🔇' : '🔊';
    btn.title = muted ? 'Unmute' : 'Mute';
  });

  return { unmount() { /* no listeners to clean */ } };
}
