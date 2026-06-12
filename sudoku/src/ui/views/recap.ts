// =====================================================================
// Weekly Recap — last 7 days summary, share-friendly
// =====================================================================
import { supabase } from '@lib/supabase';
import { useStore } from '@state/store';
import { formatTime, escapeHtml } from '@lib/format';
import { track } from '@lib/analytics';
import { bottomNavHTML, wireBottomNav, type BottomNavCallbacks } from '../components/bottom-nav';
import { ic } from '@ui/icons';

export interface RecapProps {
  onBack: () => void;
  onToast: (msg: string) => void;
  nav: BottomNavCallbacks;
}

interface Recap {
  daysPlayed: number;
  totalGames: number;
  bestTime: number | null;
  totalMistakes: number;
  totalScore: number;
  streakDelta: number;
}

async function loadRecap(): Promise<Recap> {
  const userId = useStore.getState().user?.id;
  if (!userId) throw new Error('Not signed in');

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

  const { data, error } = await supabase
    .from('user_game_history')
    .select('completed_at, time_seconds, mistakes, score')
    .eq('user_id', userId)
    .gte('completed_at', sevenDaysAgo.toISOString());

  if (error) throw error;
  const rows = (data ?? []) as Array<{
    completed_at: string; time_seconds: number; mistakes: number; score: number;
  }>;

  const daysSet = new Set<string>();
  for (const r of rows) daysSet.add(r.completed_at.slice(0, 10));

  return {
    daysPlayed: daysSet.size,
    totalGames: rows.length,
    bestTime: rows.length ? Math.min(...rows.map((r) => r.time_seconds || Infinity)) : null,
    totalMistakes: rows.reduce((a, r) => a + (r.mistakes || 0), 0),
    totalScore: rows.reduce((a, r) => a + (r.score || 0), 0),
    streakDelta: 0, // server-side calc would be nicer; left as 0 here
  };
}

function buildShareText(r: Recap): string {
  const lines = [
    '🧩 Sudoku Daily — Weekly Recap',
    `📅 ${r.daysPlayed} / 7 days played`,
    `🎮 ${r.totalGames} games · 🏆 ${r.totalScore.toLocaleString()} pts`,
    r.bestTime != null && isFinite(r.bestTime) ? `⚡ Best: ${formatTime(r.bestTime)}` : '',
    `❌ ${r.totalMistakes} mistakes`,
    '',
    'Play: sudokudaily.app',
  ].filter(Boolean);
  return lines.join('\n');
}

export function mountRecapView(root: HTMLElement, props: RecapProps): { unmount: () => void } {
  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="recap-back" aria-label="Back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <h2 style="margin:0;font-size:16px;color:var(--app-text);">${ic.daily(16)} Weekly Recap</h2>
        <span style="width:38px;"></span>
      </div>
      <div id="recap-body" class="stats-body"><div class="shop-loading">Loading recap…</div></div>
    </section>
    ${bottomNavHTML('profile')}
  `;
  wireBottomNav(root, props.nav, 'profile');
  const body = root.querySelector<HTMLElement>('#recap-body')!;

  async function load() {
    try {
      const r = await loadRecap();
      const avgGames = (r.totalGames / 7).toFixed(1);
      const winRate = r.daysPlayed === 7 ? '100%' : `${Math.round((r.daysPlayed / 7) * 100)}%`;

      body.innerHTML = `
        <div class="recap-hero">
          <div style="color:var(--brand-primary);">${ic.daily(48)}</div>
          <h2>Your week in numbers</h2>
        </div>

        <div class="profile-stats">
          <div class="stat-tile"><div class="stat-label">Days played</div><div class="stat-value">${r.daysPlayed}/7</div></div>
          <div class="stat-tile"><div class="stat-label">Consistency</div><div class="stat-value">${winRate}</div></div>
          <div class="stat-tile"><div class="stat-label">Games/day</div><div class="stat-value">${avgGames}</div></div>
        </div>

        <div class="card">
          <h3>Performance</h3>
          <div class="profile-stats" style="margin-top:8px;">
            <div class="stat-tile"><div class="stat-label">Best time</div><div class="stat-value">${r.bestTime != null && isFinite(r.bestTime) ? formatTime(r.bestTime) : '—'}</div></div>
            <div class="stat-tile"><div class="stat-label">Total score</div><div class="stat-value">${r.totalScore.toLocaleString()}</div></div>
            <div class="stat-tile"><div class="stat-label">Mistakes</div><div class="stat-value">${r.totalMistakes}</div></div>
          </div>
        </div>

        <div class="card">
          <h3>Looking good!</h3>
          <p style="opacity:0.85;font-size:14px;">
            ${r.daysPlayed >= 5
              ? `${ic.streak(14)} Great consistency this week — keep the streak going!`
              : r.daysPlayed >= 2
                ? 'Solid effort. Aim for 5+ days next week to maximize XP.'
                : 'A slow start — try logging in for a daily puzzle each day.'}
          </p>
          <button class="btn btn--full" id="recap-share" style="margin-top:12px;">${ic.share(15)} Share my week</button>
        </div>
      `;

      body.querySelector('#recap-share')?.addEventListener('click', async () => {
        track('recap_shared');
        const text = buildShareText(r);
        if ((navigator as any).share) {
          try { await (navigator as any).share({ text }); return; } catch { /* fallback */ }
        }
        try {
          await navigator.clipboard.writeText(text);
          props.onToast('Recap copied to clipboard!');
        } catch {
          props.onToast('Could not share');
        }
      });
    } catch (err) {
      body.innerHTML = `<div class="lb-empty"><p>${ic.warning(16)} ${escapeHtml((err as Error).message)}</p></div>`;
    }
  }

  root.querySelector('#recap-back')?.addEventListener('click', props.onBack);

  void load();
  return { unmount() { /* no-op */ } };
}
