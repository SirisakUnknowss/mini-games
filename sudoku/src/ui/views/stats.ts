// =====================================================================
// Stats dashboard — personal aggregates (games, win rate, avg time, etc.)
// =====================================================================
import { supabase } from '@lib/supabase';
import { useStore } from '@state/store';
import * as api from '@lib/api';
import { formatTime, formatNumber, escapeHtml } from '@lib/format';
import { drawLineChart, type LinePoint } from '@lib/chart';

interface StatRow {
  total_games: number;
  total_wins: number;
  total_time_seconds: number;
  best_time_seconds: number | null;
  total_mistakes: number;
  current_streak: number;
  longest_streak: number;
  difficulty_breakdown: Record<string, number>;
  recent: Array<{ completed_at: string; time_seconds: number }>;
}

export interface StatsProps {
  onBack: () => void;
}

async function loadStats(): Promise<StatRow> {
  const userId = useStore.getState().user?.id;
  if (!userId) throw new Error('Not signed in');

  // Aggregate from user_game_history — fall back gracefully if table is empty
  const { data: rows, error } = await supabase
    .from('user_game_history')
    .select('mode, level, time_seconds, mistakes, score, completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(60);

  if (error) throw error;

  const games = rows ?? [];
  const stats: StatRow = {
    total_games: games.length,
    total_wins: games.length, // every row in history = a completion
    total_time_seconds: games.reduce((acc, r: any) => acc + (r.time_seconds ?? 0), 0),
    best_time_seconds: games.length
      ? Math.min(...games.map((r: any) => r.time_seconds ?? Infinity))
      : null,
    total_mistakes: games.reduce((acc, r: any) => acc + (r.mistakes ?? 0), 0),
    current_streak: useStore.getState().currentStreak,
    longest_streak: useStore.getState().longestStreak,
    difficulty_breakdown: {},
    recent: (games as any[]).map((r) => ({
      completed_at: r.completed_at,
      time_seconds: r.time_seconds ?? 0,
    })).reverse(), // oldest first for chart
  };
  for (const r of games as any[]) {
    const d = r.level ?? 'unknown';
    stats.difficulty_breakdown[d] = (stats.difficulty_breakdown[d] ?? 0) + 1;
  }
  return stats;
}

export function mountStatsView(root: HTMLElement, props: StatsProps): { unmount: () => void } {
  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="stats-back" aria-label="Back">‹</button>
        <h2 style="margin:0;">📊 Stats</h2>
        <span style="width:38px;"></span>
      </div>
      <div id="stats-body" class="stats-body"><div class="shop-loading">Loading stats…</div></div>
    </section>
    <nav class="bottom-nav">
      <button id="stats-nav-home"><span class="icon">🏠</span><span>Home</span></button>
      <button id="stats-nav-lb"><span class="icon">🏆</span><span>Leaderboard</span></button>
      <button id="stats-nav-shop"><span class="icon">🛍️</span><span>Shop</span></button>
      <button class="active"><span class="icon">👤</span><span>Profile</span></button>
    </nav>
  `;

  const body = root.querySelector<HTMLElement>('#stats-body')!;

  async function load() {
    try {
      const [s, globalSummary] = await Promise.all([
        loadStats(),
        api.getGlobalSummary().catch(() => null),
      ]);
      const avgTime = s.total_games > 0 ? Math.round(s.total_time_seconds / s.total_games) : 0;
      const mistakesPerGame = s.total_games > 0 ? (s.total_mistakes / s.total_games).toFixed(1) : '0';

      // Compare-to-global delta strings
      let timeDelta = '';
      let mistakesDelta = '';
      if (globalSummary && s.total_games > 0) {
        const gAvgTime = globalSummary.avg_time_seconds ?? 0;
        if (gAvgTime > 0 && avgTime > 0) {
          const pct = Math.round(((gAvgTime - avgTime) / gAvgTime) * 100);
          timeDelta = pct > 0
            ? `⚡ ${pct}% faster than global average`
            : pct < 0
              ? `🐢 ${-pct}% slower than global average`
              : `≈ average pace`;
        }
        const gAvgMistakes = Number(globalSummary.avg_mistakes ?? 0);
        const myAvgMistakes = s.total_mistakes / s.total_games;
        if (gAvgMistakes > 0) {
          const pct = Math.round(((gAvgMistakes - myAvgMistakes) / gAvgMistakes) * 100);
          mistakesDelta = pct > 0
            ? `🎯 ${pct}% fewer mistakes than average`
            : pct < 0
              ? `❌ ${-pct}% more mistakes than average`
              : '≈ average accuracy';
        }
      }

      body.innerHTML = `
        <div class="profile-stats">
          <div class="stat-tile"><div class="stat-label">Games</div><div class="stat-value">${formatNumber(s.total_games)}</div></div>
          <div class="stat-tile"><div class="stat-label">Best time</div><div class="stat-value">${s.best_time_seconds != null && isFinite(s.best_time_seconds) ? formatTime(s.best_time_seconds) : '—'}</div></div>
          <div class="stat-tile"><div class="stat-label">Avg time</div><div class="stat-value">${avgTime ? formatTime(avgTime) : '—'}</div></div>
        </div>

        <div class="card">
          <h3>Streaks</h3>
          <div class="profile-stats" style="margin-top:8px;">
            <div class="stat-tile"><div class="stat-label">Current</div><div class="stat-value">🔥 ${s.current_streak}</div></div>
            <div class="stat-tile"><div class="stat-label">Longest</div><div class="stat-value">🏅 ${s.longest_streak}</div></div>
            <div class="stat-tile"><div class="stat-label">Mistakes/game</div><div class="stat-value">${mistakesPerGame}</div></div>
          </div>
        </div>

        ${timeDelta || mistakesDelta ? `
          <div class="card">
            <h3>vs Global average</h3>
            ${timeDelta ? `<p style="font-size:14px;margin:4px 0;">${escapeHtml(timeDelta)}</p>` : ''}
            ${mistakesDelta ? `<p style="font-size:14px;margin:4px 0;">${escapeHtml(mistakesDelta)}</p>` : ''}
            ${globalSummary ? `<p style="font-size:11px;opacity:0.7;margin-top:8px;">Based on ${formatNumber(globalSummary.total_games ?? 0)} games from ${formatNumber(globalSummary.total_players ?? 0)} players (last 30 days).</p>` : ''}
          </div>
        ` : ''}

        <div class="card">
          <h3>Time per game (last ${s.recent.length})</h3>
          <canvas id="stats-chart" class="stats-chart"></canvas>
        </div>

        <div class="card">
          <h3>By difficulty</h3>
          ${Object.entries(s.difficulty_breakdown).length === 0
            ? '<p style="opacity:0.7;font-size:13px;">Play some puzzles to see breakdown.</p>'
            : Object.entries(s.difficulty_breakdown).map(([k, v]) => `
                <div class="quest-row">
                  <div class="quest-icon">🎯</div>
                  <div class="quest-body">
                    <div class="quest-title">${escapeHtml(k)}</div>
                    <div class="quest-bar">
                      <div class="quest-bar-fill" style="width:${Math.min(100, (v / Math.max(1, s.total_games)) * 100)}%"></div>
                    </div>
                    <div class="quest-meta"><span>${v} games</span><span>${Math.round((v / Math.max(1, s.total_games)) * 100)}%</span></div>
                  </div>
                </div>
              `).join('')}
        </div>
      `;

      // Draw chart after DOM update
      const canvas = body.querySelector<HTMLCanvasElement>('#stats-chart');
      if (canvas && s.recent.length) {
        const pts: LinePoint[] = s.recent.map((r, i) => ({
          label: r.completed_at ? r.completed_at.slice(5, 10) : `#${i + 1}`,
          value: r.time_seconds,
        }));
        // Use rAF so the canvas has its real layout width
        requestAnimationFrame(() => drawLineChart(canvas, pts));
      }
    } catch (err) {
      body.innerHTML = `<div class="lb-empty"><p>⚠️ ${escapeHtml((err as Error).message)}</p></div>`;
    }
  }

  root.querySelector('#stats-back')?.addEventListener('click', props.onBack);
  root.querySelector('#stats-nav-home')?.addEventListener('click', props.onBack);

  void load();

  return { unmount() { /* no-op */ } };
}
