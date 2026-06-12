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
import { ic } from '@ui/icons';

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

const PRACTICE_META: Record<string, { label: string; sub: string; color: string }> = {
  easy:   { label: 'Easy',   sub: 'Relaxed',  color: '#10b981' },
  medium: { label: 'Medium', sub: 'Balanced', color: '#f59e0b' },
  hard:   { label: 'Hard',   sub: 'Tricky',   color: '#ef4444' },
  expert: { label: 'Expert', sub: 'Brutal',   color: '#6c5ce7' },
};

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
  const avatarUrl = state.profile?.avatar_url ?? null;
  const userIcon = equippedEmoji
    ? `<span style="font-size:20px">${equippedEmoji}</span>`
    : avatarUrl
      ? `<img src="${avatarUrl}" class="user-avatar-img" alt="avatar" referrerpolicy="no-referrer">`
      : isGuest ? ic.guest(20) : ic.member(20);
  const lvl = levelProgress(state.xp);
  const muted = isMuted();
  const guestId = getGuestDisplayId();

  root.innerHTML = `
    <section class="view view--home">

      <!-- Header -->
      <div class="home-header">
        <button class="home-user-btn" id="user-badge" type="button">
          <span class="home-avatar">${userIcon}</span>
          <div class="home-user-info">
            <span class="home-user-name">${displayName}</span>
            ${isGuest ? `<span class="home-user-id">${guestId}</span>` : ''}
          </div>
        </button>
        <div class="home-header-right">
          <span class="stat-pill">${ic.streak(13)} ${state.currentStreak}</span>
          <span class="stat-pill">${ic.coin(13)} ${formatNumber(state.coins)}</span>
          <button class="home-icon-btn" id="mute-btn" title="${muted ? 'Unmute' : 'Mute'}">
            ${muted ? ic.soundOff(16) : ic.soundOn(16)}
          </button>
        </div>
      </div>

      <!-- Level / XP -->
      <div class="home-xp">
        <div class="home-xp-label">
          <span>Level ${lvl.level}</span>
          <span>${lvl.xpIntoLevel} / ${lvl.xpIntoLevel + lvl.xpForNext} XP</span>
        </div>
        <div class="xp-bar-track">
          <div class="xp-bar-fill" style="width:${Math.round(lvl.fraction * 100)}%"></div>
        </div>
      </div>

      <!-- Guest save banner -->
      ${isGuest ? `
        <div class="home-save-banner" id="save-banner">
          <span>Playing as a guest — save so you don't lose progress.</span>
          <button class="btn btn--primary btn--small" id="save-progress">Save progress</button>
        </div>
      ` : ''}

      <!-- Daily Puzzle card -->
      <div class="daily-card-v2">
        <div class="daily-card-v2-head">
          <div>
            <div class="daily-card-v2-title">${ic.daily(18)} Daily Puzzle</div>
            <div class="daily-card-v2-date">${today} · Ready to play!</div>
          </div>
          <span class="daily-difficulty">${todayDifficulty}</span>
        </div>
        <button class="btn daily-card-v2-btn" id="play-daily">${ic.play(16)} Play Daily</button>
      </div>

      <!-- Practice -->
      <div class="home-section-label">PRACTICE</div>
      <div class="practice-grid-v2">
        ${Object.entries(PRACTICE_META).map(([key, meta]) => `
          <button class="practice-card-v2" data-practice="${key}">
            <span class="practice-card-v2-icon" style="color:${meta.color}">
              ${key === 'easy' ? ic.easy(22) : key === 'medium' ? ic.medium(22) : key === 'hard' ? ic.hard(22) : ic.expert(22)}
            </span>
            <div class="practice-card-v2-labels">
              <span class="practice-card-v2-name">${meta.label}</span>
              <span class="practice-card-v2-sub">${meta.sub}</span>
            </div>
          </button>
        `).join('')}
      </div>

      <!-- Community -->
      <div class="card live-stats-card">
        <div class="live-stats-header">
          <span class="live-dot-wrap"><span class="live-dot"></span>LIVE</span>
          <span class="live-stats-title">Community</span>
        </div>
        <div class="live-stats-grid">
          <div class="ls-block ls-block--online">
            <div class="ls-value" style="color:#10b981"><span id="vs-online">${visitorStats.loaded ? fmtCount(visitorStats.online) : '—'}</span></div>
            <div class="ls-label">online now</div>
            <div class="ls-sub">
              <span>${ic.guest(11)} <span id="vs-online-guests">${visitorStats.loaded ? fmtCount(visitorStats.online_guests) : '—'}</span></span>
              <span>${ic.member(11)} <span id="vs-online-members">${visitorStats.loaded ? fmtCount(visitorStats.online_members) : '—'}</span></span>
            </div>
          </div>
          <div class="ls-divider"></div>
          <div class="ls-block">
            <div class="ls-value"><span id="vs-today">${visitorStats.loaded ? fmtCount(visitorStats.today) : '—'}</span></div>
            <div class="ls-label">today</div>
            <div class="ls-sub">
              <span>${ic.guest(11)} <span id="vs-today-guests">${visitorStats.loaded ? fmtCount(visitorStats.today_guests) : '—'}</span></span>
              <span>${ic.member(11)} <span id="vs-today-members">${visitorStats.loaded ? fmtCount(visitorStats.today_members) : '—'}</span></span>
            </div>
          </div>
          <div class="ls-divider"></div>
          <div class="ls-block">
            <div class="ls-value"><span id="vs-total">${visitorStats.loaded ? fmtCount(visitorStats.total) : '—'}</span></div>
            <div class="ls-label">all time</div>
            <div class="ls-sub"><span>visitors</span></div>
          </div>
        </div>
      </div>

      <!-- Quests -->
      <div class="card quests-card">
        <h3>${ic.quests(16)} Quests</h3>
        <div id="quest-list" style="font-size:13px;color:var(--app-text-secondary);">
          ${isGuest ? '<span style="color:var(--brand-primary);cursor:pointer;" id="quest-signin">Sign in</span> to see daily quests.' : 'Loading…'}
        </div>
      </div>

    </section>
    ${bottomNavHTML('home')}
  `;

  root.querySelector('#play-daily')?.addEventListener('click', props.onPlayDaily);
  root.querySelectorAll('[data-practice]').forEach(btn => {
    btn.addEventListener('click', () => props.onPlayPractice((btn as HTMLElement).dataset.practice!));
  });
  wireBottomNav(root, props.nav, 'home');
  root.querySelector('#user-badge')?.addEventListener('click', props.onAuthAction);
  root.querySelector('#save-progress')?.addEventListener('click', props.onAuthAction);
  root.querySelector('#quest-signin')?.addEventListener('click', props.onAuthAction);
  root.querySelector('#mute-btn')?.addEventListener('click', (e) => {
    const nowMuted = toggleMute();
    const btn = e.currentTarget as HTMLButtonElement;
    btn.innerHTML = nowMuted ? ic.soundOff(16) : ic.soundOn(16);
    btn.title = nowMuted ? 'Unmute' : 'Mute';
  });

  return { unmount() {} };
}
