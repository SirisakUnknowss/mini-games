// =====================================================================
// Main entry point
// =====================================================================
import './ui/styles/main.css';
import { getCurrentUser, onAuthChange } from './lib/auth';
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
import { showAuthModal } from './ui/views/auth-modal';
import { mountLeaderboardView } from './ui/views/leaderboard';
import { hasCompletedOnboarding, showOnboarding } from './ui/views/onboarding';
import { renderDailyQuests } from './ui/views/quests';
import { mountShopView } from './ui/views/shop';
import { mountProfileView } from './ui/views/profile';
import { mountAchievementsView } from './ui/views/achievements';
import { mountStatsView } from './ui/views/stats';
import { mountRecapView } from './ui/views/recap';
import { mountLedgerView } from './ui/views/ledger';
import { showLevelUpModal } from './ui/views/level-up';
import { applyTheme, loadCachedThemeId } from './lib/themes';
import { applyBackground, loadCachedBgId } from './lib/backgrounds';
import { levelFromXp } from './lib/level';
import { initSound, sfxCoin, sfxStreakMilestone, sfxLevelUp } from './lib/sound';
import { signOut } from './lib/auth';
import { computeDailyCoinReward, computePracticeCoinReward, computeXpReward } from './engine/scoring';
import { trackVisit, heartbeat, leaveOnline, getVisitorStats, submitGuestScore, migrateGuestScores } from './lib/api';
import { useVisitorStore } from './state/visitor-store';

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
    const [wallet, progression, profile, equipped, inventory] = await Promise.all([
      api.getWallet(),
      api.getProgression(),
      useStore.getState().user ? api.getProfile(useStore.getState().user!.id) : Promise.resolve(null),
      api.getEquipped().catch(() => null),
      api.getInventory().catch(() => []),
    ]);
    const set = useStore.setState;
    if (wallet) set({ coins: wallet.coins });
    if (progression) set({
      xp: Number(progression.xp),
      level: progression.level,
      currentStreak: progression.current_streak,
      longestStreak: progression.longest_streak ?? 0,
    });
    if (profile) set({ profile });
    if (equipped) {
      useStore.getState().setEquipped({
        theme_id: equipped.theme_id ?? null,
        background_id: equipped.background_id ?? null,
        avatar: equipped.avatar ?? { emoji: '👤' },
      });
      if (equipped.theme_id) applyTheme(equipped.theme_id);
      if (equipped.background_id) applyBackground(equipped.background_id);
    }
    if (inventory) {
      useStore.getState().setInventory((inventory as any[]).map((r) => r.item_id));
    }
  } catch (err) {
    console.warn('Failed to load user data:', err);
  }
}

// =====================================================================
// Routing
// =====================================================================
// Shared callbacks for the bottom nav — same in every view
const navCb = {
  onHome:        () => showHome(),
  onLeaderboard: () => showLeaderboard(),
  onShop:        () => showShop(),
  onProfile:     () => showProfile(),
};

function showHome() {
  clearView();
  const view = mountHomeView(root, {
    onPlayDaily: playDaily,
    onPlayPractice: (level) => playPractice(level as Difficulty),
    onAuthAction: openAuthAction,
    nav: navCb,
  });
  currentUnmount = view.unmount;

  // Render today's quests into the home card (best-effort, background)
  const questList = document.getElementById('quest-list');
  if (questList) {
    void renderDailyQuests(questList, { onToast: toast });
  }
}

function showLeaderboard() {
  clearView();
  const view = mountLeaderboardView(root, { onBack: showHome, nav: navCb });
  currentUnmount = view.unmount;
}

function showShop() {
  clearView();
  const view = mountShopView(root, { onBack: showHome, onToast: toast, nav: navCb });
  currentUnmount = view.unmount;
}

function showProfile() {
  clearView();
  const view = mountProfileView(root, {
    onBack: showHome,
    onOpenStats: showStats,
    onOpenAchievements: showAchievements,
    onOpenRecap: showRecap,
    onOpenLedger: showLedger,
    onSignOut: () => {
      if (confirm('Sign out?')) {
        void signOut().then(() => {
          useStore.setState({ user: null, profile: null, coins: 0, xp: 0, level: 1, currentStreak: 0 });
          applyBackground('bg_default');
          applyTheme('theme_classic');
          void boot();
        });
      }
    },
    onUpgradeAccount: openAuthAction,
    onToast: toast,
    nav: navCb,
  });
  currentUnmount = view.unmount;
}

function showAchievements() {
  clearView();
  const view = mountAchievementsView(root, { onBack: showProfile, nav: navCb });
  currentUnmount = view.unmount;
}

function showStats() {
  clearView();
  const view = mountStatsView(root, { onBack: showProfile, nav: navCb });
  currentUnmount = view.unmount;
}

function showRecap() {
  clearView();
  const view = mountRecapView(root, { onBack: showProfile, onToast: toast, nav: navCb });
  currentUnmount = view.unmount;
}

function showLedger() {
  clearView();
  const view = mountLedgerView(root, { onBack: showProfile, nav: navCb });
  currentUnmount = view.unmount;
}

function openAuthAction() {
  const user = useStore.getState().user;
  if (user?.is_anonymous) {
    showAuthModal({
      isUpgrade: true,
      onSuccess: async () => {
        const migrated = await migrateGuestScores();
        await loadUserData();
        showHome();
        const msg = migrated > 0
          ? `Progress saved! ${migrated} game${migrated > 1 ? 's' : ''} transferred to your account.`
          : 'Progress saved! Sign in from any device to continue.';
        toast(msg, 3500);
      },
      onCancel: () => {},
    });
  } else if (user) {
    // Already signed in → go to profile
    showProfile();
  } else {
    showAuthModal({
      onSuccess: async () => {
        const migrated = await migrateGuestScores();
        await loadUserData();
        showHome();
        if (migrated > 0) toast(`Welcome back! ${migrated} guest game${migrated > 1 ? 's' : ''} imported.`, 3500);
      },
      onCancel: () => {},
    });
  }
}

// (profile menu now lives in mountProfileView)

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
    onNewGame: () => void playPractice(level),
  });
  currentUnmount = view.unmount;
}

function showLoadingOverlay(text = 'Saving your score...'): () => void {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="spinner"></div>
    <p style="font-weight: 600; font-size: 15px; text-align: center;">${text}</p>
  `;
  document.body.appendChild(overlay);
  return () => overlay.remove();
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
  const prevLevel = useStore.getState().level;
  const newXp = useStore.getState().xp + xp;
  const newLevel = levelFromXp(newXp);
  useStore.setState({
    coins: useStore.getState().coins + coins,
    xp: newXp,
    level: newLevel,
  });
  if (newLevel > prevLevel) {
    // Show level-up modal after the win modal closes
    setTimeout(() => {
      sfxLevelUp();
      showLevelUpModal({ newLevel, rewardCoins: 50 * (newLevel - prevLevel) });
    }, 600);
    track('level_up', { from: prevLevel, to: newLevel });
  }

  let rank: number | undefined;
  let totalPlayers: number | undefined;

  const isGuest = !useStore.getState().user || !!useStore.getState().user?.is_anonymous;

  const hideLoading = showLoadingOverlay(
    result.mode === 'daily'
      ? 'Submitting daily score...'
      : 'Saving practice progress...'
  );

  try {
    if (isGuest) {
      // Guest path — save to guest_game_history (no auth needed)
      await submitGuestScore({
        mode: result.mode,
        daily_date: date,
        level: result.difficulty,
        time_seconds: result.timeSeconds,
        mistakes: result.mistakes,
        hints_used: result.hintsUsed,
        score: result.score,
      });
    } else if (result.mode === 'daily' && date) {
      // Signed-in member — submit to real leaderboard
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
        await refreshStreakAndToast();
      } catch (err) {
        console.warn('Submit failed (offline?):', err);
      }
    } else if (result.mode === 'practice' && !isGuest) {
      try {
        await api.submitPracticeScore({
          level: result.difficulty,
          stage: 1,
          time_seconds: result.timeSeconds,
          mistakes: result.mistakes,
          hints_used: result.hintsUsed,
        });
      } catch (err) {
        console.warn('Practice submit failed:', err);
      }
    }
  } finally {
    hideLoading();
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

const STREAK_MILESTONES = new Set([3, 7, 14, 30, 60, 100, 365]);

async function refreshStreakAndToast() {
  try {
    const prevStreak = useStore.getState().currentStreak;
    const prog = await api.getProgression();
    if (!prog) return;
    const newStreak = prog.current_streak ?? 0;
    useStore.setState({
      xp: Number(prog.xp ?? useStore.getState().xp),
      level: prog.level ?? useStore.getState().level,
      currentStreak: newStreak,
    });
    if (newStreak > prevStreak) {
      if (STREAK_MILESTONES.has(newStreak)) {
        track(Events.STREAK_MILESTONE, { streak: newStreak });
        sfxStreakMilestone();
        toast(`🔥 ${newStreak}-day streak! Keep it up!`, 4000);
      } else {
        sfxCoin();
        toast(`🔥 Streak saved — ${newStreak} day${newStreak === 1 ? '' : 's'}!`);
      }
    } else if (newStreak < prevStreak && prevStreak > 0) {
      track(Events.STREAK_LOST, { previous: prevStreak });
    }
  } catch (err) {
    console.warn('Streak refresh failed:', err);
  }
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
// Visitor count formatter  e.g. 1200 → "1.2K"
// =====================================================================
function formatVisitorCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

async function refreshVisitorStats() {
  const stats = await getVisitorStats();
  if (!stats) return;
  useVisitorStore.getState().setStats(stats);
  // Live-patch DOM without re-rendering the whole view
  const patch = (id: string, val: number) => {
    const el = document.getElementById(id);
    if (el) el.textContent = formatVisitorCount(val);
  };
  patch('vs-online',         stats.online);
  patch('vs-online-guests',  stats.online_guests);
  patch('vs-online-members', stats.online_members);
  patch('vs-today',          stats.today);
  patch('vs-today-guests',   stats.today_guests);
  patch('vs-today-members',  stats.today_members);
  patch('vs-total',          stats.total);
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
  // Apply cached theme + background before first paint to avoid flicker
  const cachedTheme = loadCachedThemeId();
  if (cachedTheme) applyTheme(cachedTheme);
  const cachedBg = loadCachedBgId();
  if (cachedBg) applyBackground(cachedBg);

  // Init sound (loads mute preference)
  initSound();

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
      // Use getCurrentUser() only — never auto-sign-in anonymously at boot.
      // signInAnonymously() on a project without anonymous auth enabled
      // invalidates the supabase-js auth state, which strips the Bearer token
      // from subsequent REST requests and causes 401 on visitor_sessions.
      const user = await Promise.race([
        getCurrentUser(),
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
        // Migrate any local guest scores (handles Google OAuth redirect login)
        // migrateGuestScores() is idempotent — safe to call on every boot when user exists
        if (localStorage.getItem('sudoku_guest_display_id_v1')) {
          const migrated = await migrateGuestScores();
          if (migrated > 0) {
            console.info(`[Boot] Migrated ${migrated} guest score(s) from local session`);
          }
        }
        await loadUserData();
      } else {
        // No existing session → run as guest (visitor tracking still works via anon key)
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

  // Track visit + start heartbeat loop (best-effort, non-blocking)
  void (async () => {
    const isGuest = !useStore.getState().user || !!useStore.getState().user?.is_anonymous;
    await trackVisit(isGuest);
    await heartbeat(isGuest);
    await refreshVisitorStats();
  })();

  // Heartbeat every 30s — keeps "online now" count accurate
  const heartbeatInterval = setInterval(async () => {
    const isGuest = !useStore.getState().user || !!useStore.getState().user?.is_anonymous;
    await heartbeat(isGuest);
    await refreshVisitorStats();
  }, 30_000);

  // Leave online on tab close
  window.addEventListener('beforeunload', () => {
    void leaveOnline();
    clearInterval(heartbeatInterval);
  });

  // Show onboarding once per device (after home is mounted so it has a backdrop)
  if (!hasCompletedOnboarding()) {
    showOnboarding({ onFinish: () => { /* user is on home; quest list will pick up name on next render */ showHome(); } });
  }
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  root.innerHTML = `<div class="loading-screen"><h1>⚠️ Error</h1><p>${err.message}</p></div>`;
});
