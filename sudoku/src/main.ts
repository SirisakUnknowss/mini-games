// =====================================================================
// Main entry point
// =====================================================================
import './ui/styles/main.css';
import { ensureUser, onAuthChange } from './lib/auth';
import { useStore } from './state/store';
import * as api from './lib/api';
import { initAnalytics, track, identify, captureError, Events } from './lib/analytics';
import { migrateFromV1, shouldMigrate } from './lib/migrate-v1';
import { generatePuzzle, generateDailyPuzzle } from './engine/generator';
import type { Difficulty } from './engine/types';
import { todayUtc } from './lib/format';
import { mountHomeView } from './ui/views/home';
import { mountGameView, type GameResult } from './ui/views/game';
import { showWinModal, buildShareText } from './ui/views/win-modal';
import { mountSplash } from './ui/views/splash';
import { computeDailyCoinReward, computePracticeCoinReward, computeXpReward } from './engine/scoring';

const root = document.getElementById('app')!;
let currentUnmount: (() => void) | null = null;

function clearView() {
  if (currentUnmount) {
    currentUnmount();
    currentUnmount = null;
  }
  root.innerHTML = '';
}

async function loadUserData(): Promise<void> {
  try {
    const [wallet, progression, profile] = await Promise.all([
      api.getWallet(),
      api.getProgression(),
      useStore.getState().user ? api.getProfile(useStore.getState().user!.id) : Promise.resolve(null),
    ]);
    const set = useStore.setState;
    if (wallet) set({ coins: wallet.coins });
    if (progression) set({
      xp: Number(progression.xp),
      level: progression.level,
      currentStreak: progression.current_streak,
    });
    if (profile) set({ profile });
  } catch (err) {
    console.warn('Failed to load user data:', err);
  }
}

// =====================================================================
// Routing
// =====================================================================
function showHome() {
  clearView();
  const view = mountHomeView(root, {
    onPlayDaily: playDaily,
    onPlayPractice: (level) => playPractice(level as Difficulty),
    onOpenLeaderboard: () => toast('Leaderboard coming soon'),
    onOpenShop: () => toast('Shop coming soon'),
    onOpenProfile: () => toast('Profile coming soon'),
  });
  currentUnmount = view.unmount;
}

async function playDaily() {
  const date = todayUtc();
  track(Events.DAILY_PUZZLE_STARTED, { date });
  let puzzleData;
  // Try fetch from server; fallback to local generation
  try {
    const remote = await api.getDailyPuzzle(date);
    if (remote) {
      const puzzleStr = remote.puzzle as string;
      const board = stringToBoard(puzzleStr);
      // Solution comes from local gen (same seed)
      const local = generateDailyPuzzle(date);
      puzzleData = {
        puzzle: board,
        solution: local.solution,
        difficulty: remote.difficulty,
      };
    } else {
      throw new Error('No daily on server');
    }
  } catch {
    // Local fallback (deterministic via date seed)
    const local = generateDailyPuzzle(date);
    puzzleData = local;
  }

  clearView();
  const view = mountGameView(root, {
    mode: 'daily',
    difficulty: puzzleData.difficulty,
    puzzle: puzzleData.puzzle,
    solution: puzzleData.solution,
    date,
    onWin: (result) => handleWin(result, date),
    onExit: showHome,
  });
  currentUnmount = view.unmount;
}

async function playPractice(level: Difficulty) {
  // For MVP, use a random seed; later use stage system
  const stage = Math.floor(Math.random() * 100) + 1;
  const seed = `practice:${level}:${stage}`;
  const puzzleData = generatePuzzle({ difficulty: level, seed });
  track(Events.PRACTICE_STARTED, { level, stage });

  clearView();
  const view = mountGameView(root, {
    mode: 'practice',
    difficulty: level,
    puzzle: puzzleData.puzzle,
    solution: puzzleData.solution,
    stage,
    onWin: (result) => handleWin(result),
    onExit: showHome,
  });
  currentUnmount = view.unmount;
}

async function handleWin(result: GameResult, date?: string) {
  const event = result.mode === 'daily' ? Events.DAILY_PUZZLE_COMPLETED : Events.PRACTICE_COMPLETED;
  track(event, {
    difficulty: result.difficulty,
    time_seconds: result.timeSeconds,
    mistakes: result.mistakes,
    hints_used: result.hintsUsed,
    score: result.score,
  });
  const scoreInput = {
    difficulty: result.difficulty,
    timeSeconds: result.timeSeconds,
    mistakes: result.mistakes,
    hintsUsed: result.hintsUsed,
  };
  const coins = result.mode === 'daily'
    ? computeDailyCoinReward(scoreInput)
    : computePracticeCoinReward(result.difficulty);
  const xp = computeXpReward(scoreInput, result.mode);

  // Optimistic update
  useStore.setState({
    coins: useStore.getState().coins + coins,
    xp: useStore.getState().xp + xp,
  });

  let rank: number | undefined;
  let totalPlayers: number | undefined;

  // Submit to server
  if (result.mode === 'daily' && date) {
    try {
      const { data } = await api.submitDailyScore({
        date,
        started_at: result.startedAt,
        completed_at: result.completedAt,
        time_seconds: result.timeSeconds,
        mistakes: result.mistakes,
        hints_used: result.hintsUsed,
        moves: result.moves,
      });
      if (data?.rank) {
        rank = data.rank;
        totalPlayers = data.total_players;
      }
    } catch (err) {
      console.warn('Submit failed (offline?):', err);
      // TODO: queue for sync
    }
  } else if (result.mode === 'practice') {
    try {
      await api.submitPracticeScore({
        level: result.difficulty,
        stage: 1, // TODO
        time_seconds: result.timeSeconds,
        mistakes: result.mistakes,
        hints_used: result.hintsUsed,
      });
    } catch (err) {
      console.warn('Practice submit failed:', err);
    }
  }

  showWinModal({
    result,
    rank,
    totalPlayers,
    coinsEarned: coins,
    xpEarned: xp,
    onContinue: showHome,
    onShare: date ? () => shareResult(result, date, rank, totalPlayers) : undefined,
  });
}

async function shareResult(result: GameResult, date: string, rank?: number, total?: number) {
  track(Events.SHARE_RESULT, { date, rank });
  const text = buildShareText(result, date, rank, total);
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch { /* fallback */ }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard!');
  } catch {
    toast('Failed to share');
  }
}

// =====================================================================
// Toast
// =====================================================================
function toast(msg: string, durationMs = 2500) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), durationMs);
}

// =====================================================================
// Utilities
// =====================================================================
function stringToBoard(s: string): number[][] {
  const board: number[][] = [];
  for (let r = 0; r < 9; r++) {
    board.push([]);
    for (let c = 0; c < 9; c++) {
      board[r].push(parseInt(s[r * 9 + c], 10));
    }
  }
  return board;
}

// =====================================================================
// Boot
// =====================================================================
async function boot() {
  // Init analytics first — safe even with empty keys
  initAnalytics();
  track(Events.APP_OPEN);

  // Show animated splash immediately
  root.innerHTML = '';
  const splash = mountSplash(root);
  const minSplashDuration = new Promise<void>((resolve) => setTimeout(resolve, 1800));

  const hasSupabase = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (hasSupabase) {
    try {
      onAuthChange((user) => {
        useStore.setState({ user });
        if (user) identify(user.id);
      });
      const user = await Promise.race([
        ensureUser(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
      ]);
      if (user) {
        useStore.setState({ user });
        identify(user.id);
        // Run v1 migration if applicable
        if (shouldMigrate()) {
          const result = await migrateFromV1();
          if (result.ran && result.imported) {
            console.info('[Boot] Migrated v1 data:', result.imported);
          }
        }
        await loadUserData();
      } else {
        console.warn('[Boot] Supabase unreachable — running in offline demo mode');
        useStore.setState({ profile: { display_name: 'Guest' }, coins: 100 });
      }
    } catch (err) {
      captureError(err, { phase: 'boot' });
      console.warn('[Boot] Supabase error — offline demo mode:', err);
      useStore.setState({ profile: { display_name: 'Guest' }, coins: 100 });
    }
  } else {
    console.info('[Boot] No Supabase config — running in offline demo mode');
    useStore.setState({ profile: { display_name: 'Guest' }, coins: 100 });
  }

  // Wait for splash min duration, then unmount with exit animation
  await minSplashDuration;
  await splash.unmount();

  showHome();
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  root.innerHTML = `<div class="loading-screen"><h1>⚠️ Error</h1><p>${err.message}</p></div>`;
});
