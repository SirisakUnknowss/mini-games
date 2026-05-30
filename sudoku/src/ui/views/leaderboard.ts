// =====================================================================
// Leaderboard view — Today / Yesterday tabs + realtime updates
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

type Tab = 'today' | 'yesterday';

interface Row {
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

function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function mountLeaderboardView(root: HTMLElement, props: LeaderboardProps): { unmount: () => void } {
  let activeTab: Tab = 'today';
  let rows: Row[] = [];
  let loading = true;
  let errorMsg: string | null = null;
  let channel: ReturnType<typeof supabase.channel> | null = null;

  const currentUserId = useStore.getState().user?.id ?? null;

  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="lb-back" aria-label="Back">‹</button>
        <h2 style="margin:0;">🏆 Leaderboard</h2>
        <span style="width:38px;"></span>
      </div>

      <div class="lb-tabs">
        <button class="lb-tab active" data-tab="today">Today</button>
        <button class="lb-tab" data-tab="yesterday">Yesterday</button>
      </div>

      <div class="lb-meta" id="lb-meta"></div>
      <div class="lb-list" id="lb-list"></div>

      <button class="btn btn--secondary btn--small lb-scroll" id="lb-scroll" hidden>
        Scroll to my rank
      </button>
    </section>
    ${bottomNavHTML('leaderboard')}
  `;
  wireBottomNav(root, props.nav, 'leaderboard');

  const listEl = root.querySelector<HTMLElement>('#lb-list')!;
  const metaEl = root.querySelector<HTMLElement>('#lb-meta')!;
  const scrollBtn = root.querySelector<HTMLButtonElement>('#lb-scroll')!;

  function dateForTab(): string {
    return activeTab === 'today' ? todayUtc() : yesterdayUtc();
  }

  function render() {
    if (loading) {
      listEl.innerHTML = `
        <div class="lb-skeleton">
          ${Array.from({ length: 6 }).map(() => `<div class="lb-skeleton-row"></div>`).join('')}
        </div>
      `;
      metaEl.textContent = '';
      scrollBtn.hidden = true;
      return;
    }
    if (errorMsg) {
      listEl.innerHTML = `
        <div class="lb-empty">
          <p>⚠️ ${escapeHtml(errorMsg)}</p>
          <button class="btn btn--small" id="lb-retry">Retry</button>
        </div>
      `;
      listEl.querySelector('#lb-retry')?.addEventListener('click', () => void load());
      metaEl.textContent = '';
      scrollBtn.hidden = true;
      return;
    }
    if (rows.length === 0) {
      listEl.innerHTML = `
        <div class="lb-empty">
          <p>🫥 No scores yet for ${dateForTab()}.</p>
          <p style="opacity:0.75;font-size:13px;">Be the first to finish today's puzzle!</p>
        </div>
      `;
      metaEl.textContent = '';
      scrollBtn.hidden = true;
      return;
    }

    const myRow = rows.find((r) => r.user_id === currentUserId);
    metaEl.innerHTML = `
      <span>${rows[0].total_players} players</span>
      ${myRow ? `<span>·</span><span>Your rank: <strong>#${myRow.rank}</strong></span>` : ''}
    `;

    listEl.innerHTML = rows.map((r) => {
      const isMe = r.user_id === currentUserId;
      const name = r.display_name || r.username || 'Player';
      const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : '';
      return `
        <div class="lb-row${isMe ? ' is-me' : ''}" data-uid="${escapeHtml(r.user_id)}">
          <span class="lb-rank">${medal || '#' + r.rank}</span>
          <span class="lb-name">${escapeHtml(name)}${isMe ? ' <span class="lb-you">you</span>' : ''}</span>
          <span class="lb-score">
            <strong>${r.score.toLocaleString()}</strong>
            <small>${formatTime(r.time_seconds)} · ❌${r.mistakes}</small>
          </span>
        </div>
      `;
    }).join('');

    scrollBtn.hidden = !myRow;
  }

  async function load() {
    loading = true;
    errorMsg = null;
    render();
    try {
      const data = await api.getLeaderboard(dateForTab(), 100);
      rows = (data ?? []) as Row[];
      loading = false;
      render();
      subscribeRealtime();
    } catch (err) {
      loading = false;
      errorMsg = (err as Error).message || 'Could not load leaderboard.';
      render();
    }
  }

  function subscribeRealtime() {
    // Only subscribe for "today" — yesterday is frozen
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
    if (activeTab !== 'today') return;

    const today = todayUtc();
    channel = supabase
      .channel(`lb:${today}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_leaderboard', filter: `date=eq.${today}` },
        () => {
          // Re-fetch on any insert/update — view recomputes rank
          void refetch();
        },
      )
      .subscribe();
  }

  async function refetch() {
    try {
      const data = await api.getLeaderboard(dateForTab(), 100);
      rows = (data ?? []) as Row[];
      render();
    } catch {
      /* keep current rows */
    }
  }

  // Tabs
  root.querySelectorAll<HTMLButtonElement>('.lb-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.tab as Tab;
      if (next === activeTab) return;
      activeTab = next;
      root.querySelectorAll<HTMLButtonElement>('.lb-tab').forEach((b) => {
        b.classList.toggle('active', b.dataset.tab === activeTab);
      });
      void load();
    });
  });

  // Back
  root.querySelector('#lb-back')?.addEventListener('click', props.onBack);

  // Scroll to me
  scrollBtn.addEventListener('click', () => {
    if (!currentUserId) return;
    const target = listEl.querySelector<HTMLElement>(`.lb-row[data-uid="${currentUserId}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target?.classList.add('flash');
    setTimeout(() => target?.classList.remove('flash'), 1200);
  });

  void load();

  return {
    unmount() {
      if (channel) {
        void supabase.removeChannel(channel);
        channel = null;
      }
    },
  };
}
