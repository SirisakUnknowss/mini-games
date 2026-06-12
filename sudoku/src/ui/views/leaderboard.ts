// =====================================================================
// Leaderboard view — Members (Today/Yesterday) + Guests tab
// =====================================================================
import { useStore } from '@state/store';
import { supabase } from '@lib/supabase';
import * as api from '@lib/api';
import { formatTime, todayUtc, escapeHtml } from '@lib/format';
import { bottomNavHTML, wireBottomNav, type BottomNavCallbacks } from '../components/bottom-nav';

export interface LeaderboardProps {
  onBack: () => void;
  nav: BottomNavCallbacks;
}

type MainTab = 'members' | 'guests';
type DateTab = 'today' | 'yesterday';

interface MemberRow {
  date: string;
  user_id: string;
  rank: number;
  score: number;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
  display_name: string | null;
  username: string | null;
  country: string | null;
  avatar: unknown;
  total_players: number;
}

interface GuestRow {
  session_id: string;
  guest_display_id: string;
  daily_date: string;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
  score: number;
  rank: number;
  total_players: number;
  completed_at: string;
}

function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function mountLeaderboardView(root: HTMLElement, props: LeaderboardProps): { unmount: () => void } {
  let mainTab: MainTab = 'members';
  let dateTab: DateTab = 'today';
  let memberRows: MemberRow[] = [];
  let guestRows: GuestRow[] = [];
  let loading = true;
  let errorMsg: string | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const currentUserId = useStore.getState().user?.id ?? null;
  const myGuestId = api.getGuestDisplayId();       // G-XXXXXX for this device
  const mySessionId = api.getSessionId();

  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="lb-back" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style="margin:0;font-size:16px;color:var(--app-text);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>Leaderboard
        </h2>
        <span style="width:38px;"></span>
      </div>

      <!-- Main tabs: Members | Guests -->
      <div class="lb-tabs lb-tabs--main">
        <button class="lb-tab active" data-main="members">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>Members
        </button>
        <button class="lb-tab" data-main="guests">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px"><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>Guests
        </button>
      </div>

      <!-- Date sub-tabs -->
      <div class="lb-tabs lb-tabs--date" id="lb-date-tabs">
        <button class="lb-tab-sm active" data-date="today">Today</button>
        <button class="lb-tab-sm" data-date="yesterday">Yesterday</button>
      </div>

      <!-- Guest ID badge -->
      <div class="lb-guest-badge" id="lb-guest-badge" hidden>
        Your ID: <strong id="lb-my-guest-id">${escapeHtml(myGuestId)}</strong>
      </div>

      <div class="lb-meta" id="lb-meta"></div>
      <div class="lb-list" id="lb-list"></div>

      <button class="btn btn--primary btn--small lb-scroll" id="lb-scroll" hidden>
        Scroll to my rank
      </button>
    </section>
    ${bottomNavHTML('leaderboard')}
  `;
  wireBottomNav(root, props.nav, 'leaderboard');

  const listEl   = root.querySelector<HTMLElement>('#lb-list')!;
  const metaEl   = root.querySelector<HTMLElement>('#lb-meta')!;
  const scrollBtn = root.querySelector<HTMLButtonElement>('#lb-scroll')!;
  const dateTabs = root.querySelector<HTMLElement>('#lb-date-tabs')!;
  const guestBadge = root.querySelector<HTMLElement>('#lb-guest-badge')!;

  function activeDate(): string {
    return dateTab === 'today' ? todayUtc() : yesterdayUtc();
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  function render() {
    if (loading) {
      listEl.innerHTML = `
        <div class="lb-skeleton">
          ${Array.from({ length: 6 }).map(() => `<div class="lb-skeleton-row"></div>`).join('')}
        </div>`;
      metaEl.textContent = '';
      scrollBtn.hidden = true;
      return;
    }
    if (errorMsg) {
      listEl.innerHTML = `
        <div class="lb-empty">
          <p>⚠️ ${escapeHtml(errorMsg)}</p>
          <button class="btn btn--small" id="lb-retry">Retry</button>
        </div>`;
      listEl.querySelector('#lb-retry')?.addEventListener('click', () => void load());
      metaEl.textContent = '';
      scrollBtn.hidden = true;
      return;
    }

    if (mainTab === 'members') renderMembers();
    else renderGuests();
  }

  function renderMembers() {
    if (memberRows.length === 0) {
      listEl.innerHTML = `
        <div class="lb-empty">
          <p>🫥 No scores yet for ${activeDate()}.</p>
          <p style="opacity:0.75;font-size:13px;">Be the first to finish today's puzzle!</p>
        </div>`;
      metaEl.textContent = '';
      scrollBtn.hidden = true;
      return;
    }
    const myRow = memberRows.find((r) => r.user_id === currentUserId);
    metaEl.innerHTML = `
      <span>${memberRows[0].total_players} players</span>
      ${myRow ? `<span>·</span><span>Your rank: <strong>#${myRow.rank}</strong></span>` : ''}
    `;
    listEl.innerHTML = memberRows.map((r) => {
      const isMe = r.user_id === currentUserId;
      const name  = escapeHtml(r.display_name || r.username || 'Player');
      const badgeCls = r.rank === 1 ? 'lb-rank-1' : r.rank === 2 ? 'lb-rank-2' : r.rank === 3 ? 'lb-rank-3' : 'lb-rank-other';
      return `
        <div class="lb-row${isMe ? ' is-me' : ''}" data-uid="${escapeHtml(r.user_id)}">
          <span class="lb-rank"><span class="lb-rank-badge ${badgeCls}">${r.rank}</span></span>
          <div>
            <div class="lb-name">${name}${isMe ? ' <span class="lb-you">you</span>' : ''}</div>
            <div class="lb-sub-name">Finished today</div>
          </div>
          <span class="lb-score">
            <strong>${r.score.toLocaleString()}</strong>
            <small>${formatTime(r.time_seconds)}</small>
          </span>
        </div>`;
    }).join('');
    scrollBtn.hidden = !myRow;
  }

  function renderGuests() {
    if (guestRows.length === 0) {
      listEl.innerHTML = `
        <div class="lb-empty">
          <p>👻 No guest scores yet for today.</p>
          <p style="opacity:0.75;font-size:13px;">Play the daily puzzle to appear here!</p>
        </div>`;
      metaEl.textContent = '';
      scrollBtn.hidden = true;
      return;
    }
    const myRow = guestRows.find((r) => r.session_id === mySessionId);
    metaEl.innerHTML = `
      <span>${guestRows[0].total_players} guests</span>
      ${myRow ? `<span>·</span><span>Your rank: <strong>#${myRow.rank}</strong></span>` : ''}
    `;
    listEl.innerHTML = guestRows.map((r) => {
      const isMe = r.session_id === mySessionId;
      const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : '';
      return `
        <div class="lb-row${isMe ? ' is-me' : ''}" data-sid="${escapeHtml(r.session_id)}">
          <span class="lb-rank">${medal || '#' + r.rank}</span>
          <span class="lb-name lb-guest-id">
            ${escapeHtml(r.guest_display_id)}${isMe ? ' <span class="lb-you">you</span>' : ''}
          </span>
          <span class="lb-score">
            <strong>${r.score.toLocaleString()}</strong>
            <small>${formatTime(r.time_seconds)}</small>
          </span>
        </div>`;
    }).join('');
    scrollBtn.hidden = !myRow;
  }

  // -----------------------------------------------------------------------
  // Load
  // -----------------------------------------------------------------------
  async function load() {
    loading = true;
    errorMsg = null;
    render();
    try {
      if (mainTab === 'members') {
        const data = await api.getLeaderboard(activeDate(), 100);
        memberRows = (data ?? []) as MemberRow[];
        subscribeRealtime();
      } else {
        const data = await api.getGuestLeaderboard(todayUtc(), 100);
        guestRows = (data ?? []) as GuestRow[];
      }
      loading = false;
      render();
    } catch (err) {
      loading = false;
      errorMsg = (err as Error).message || 'Could not load leaderboard.';
      render();
    }
  }

  function subscribeRealtime() {
    if (channel) { void supabase.removeChannel(channel); channel = null; }
    if (mainTab !== 'members' || dateTab !== 'today') return;
    const today = todayUtc();
    channel = supabase
      .channel(`lb:${today}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'daily_leaderboard', filter: `date=eq.${today}` },
        () => void refetch()
      )
      .subscribe();
  }

  async function refetch() {
    try {
      if (mainTab === 'members') {
        const data = await api.getLeaderboard(activeDate(), 100);
        memberRows = (data ?? []) as MemberRow[];
      } else {
        const data = await api.getGuestLeaderboard(todayUtc(), 100);
        guestRows = (data ?? []) as GuestRow[];
      }
      render();
    } catch { /* keep current */ }
  }

  // -----------------------------------------------------------------------
  // Tab wiring
  // -----------------------------------------------------------------------
  root.querySelectorAll<HTMLButtonElement>('[data-main]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.main as MainTab;
      if (next === mainTab) return;
      mainTab = next;

      // Toggle main tab active state
      root.querySelectorAll<HTMLButtonElement>('[data-main]').forEach((b) =>
        b.classList.toggle('active', b.dataset.main === mainTab)
      );

      // Show/hide date sub-tabs and guest badge
      dateTabs.hidden  = mainTab === 'guests';
      guestBadge.hidden = mainTab === 'members';

      void load();
    });
  });

  root.querySelectorAll<HTMLButtonElement>('[data-date]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.date as DateTab;
      if (next === dateTab) return;
      dateTab = next;
      root.querySelectorAll<HTMLButtonElement>('[data-date]').forEach((b) =>
        b.classList.toggle('active', b.dataset.date === dateTab)
      );
      void load();
    });
  });

  root.querySelector('#lb-back')?.addEventListener('click', props.onBack);

  scrollBtn.addEventListener('click', () => {
    if (mainTab === 'members' && currentUserId) {
      const target = listEl.querySelector<HTMLElement>(`.lb-row[data-uid="${currentUserId}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.classList.add('flash'); setTimeout(() => target?.classList.remove('flash'), 1200);
    } else if (mainTab === 'guests') {
      const target = listEl.querySelector<HTMLElement>(`.lb-row[data-sid="${mySessionId}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.classList.add('flash'); setTimeout(() => target?.classList.remove('flash'), 1200);
    }
  });

  void load();

  return {
    unmount() {
      if (channel) { void supabase.removeChannel(channel); channel = null; }
    },
  };
}
