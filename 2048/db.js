// =====================================================================
// 2048 — localStorage DB (matches pattern of match-three / suika)
// Key: g2048_db_v1
// =====================================================================
(function () {
  const KEY = 'g2048_db_v1';
  const SALT = 'g2048-salt-v1::';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* corrupted */ }
    return { currentUser: null, users: {} };
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('save failed', e); }
  }
  function hash(pw) {
    return btoa(SALT + pw);
  }

  function emptyUser(password) {
    return {
      password: hash(password),
      createdAt: Date.now(),
      settings: { animations: true },
      stats: {
        totalPlays: 0,
        totalScore: 0,
        totalPlayTime: 0,
        highScore: 0,
        highestTile: 0,
      },
      recent: [],
      board: null,   // saved game state (board + score)
    };
  }

  const DB = {
    signup(username, password) {
      if (!username || !password) return { ok: false, err: 'Username and password required' };
      if (username.length < 2) return { ok: false, err: 'Username too short' };
      if (password.length < 4) return { ok: false, err: 'Password too short (min 4)' };
      const state = load();
      const key = username.toLowerCase();
      if (state.users[key]) return { ok: false, err: 'Username already taken' };
      state.users[key] = emptyUser(password);
      state.currentUser = key;
      save(state);
      return { ok: true };
    },

    login(username, password) {
      const state = load();
      const key = (username || '').toLowerCase();
      const u = state.users[key];
      if (!u) return { ok: false, err: 'User not found' };
      if (u.password !== hash(password)) return { ok: false, err: 'Wrong password' };
      state.currentUser = key;
      save(state);
      return { ok: true };
    },

    logout() {
      const state = load();
      state.currentUser = null;
      save(state);
    },

    getCurrentUser() {
      const state = load();
      if (!state.currentUser) return null;
      const u = state.users[state.currentUser];
      if (!u) return null;
      return { username: state.currentUser, ...u };
    },

    updateSettings(partial) {
      const state = load();
      if (!state.currentUser) return;
      Object.assign(state.users[state.currentUser].settings, partial);
      save(state);
    },

    changePassword(oldPw, newPw) {
      if (!newPw || newPw.length < 4) return { ok: false, err: 'New password too short' };
      const state = load();
      const u = state.users[state.currentUser];
      if (!u) return { ok: false, err: 'Not signed in' };
      if (u.password !== hash(oldPw)) return { ok: false, err: 'Wrong current password' };
      u.password = hash(newPw);
      save(state);
      return { ok: true };
    },

    resetProgress() {
      const state = load();
      const u = state.users[state.currentUser];
      if (!u) return;
      u.stats = emptyUser('').stats;
      u.recent = [];
      u.board = null;
      save(state);
    },

    deleteAccount() {
      const state = load();
      if (!state.currentUser) return;
      delete state.users[state.currentUser];
      state.currentUser = null;
      save(state);
    },

    recordGame({ score, highestTile, duration }) {
      const state = load();
      const u = state.users[state.currentUser];
      if (!u) return { isNewBest: false };
      u.stats.totalPlays += 1;
      u.stats.totalScore += score;
      u.stats.totalPlayTime += duration;
      const isNewBest = score > u.stats.highScore;
      if (isNewBest) u.stats.highScore = score;
      if (highestTile > u.stats.highestTile) u.stats.highestTile = highestTile;
      u.recent.unshift({ score, highestTile, duration, playedAt: Date.now() });
      u.recent = u.recent.slice(0, 20);
      save(state);
      return { isNewBest };
    },

    saveBoard(snapshot) {
      const state = load();
      const u = state.users[state.currentUser];
      if (!u) return;
      u.board = snapshot;
      save(state);
    },

    loadBoard() {
      const state = load();
      const u = state.users[state.currentUser];
      return u ? u.board : null;
    },

    getGlobalLeaderboard(limit = 50) {
      const state = load();
      const rows = Object.entries(state.users).map(([name, u]) => ({
        name,
        score: u.stats.highScore || 0,
        highestTile: u.stats.highestTile || 0,
      }));
      rows.sort((a, b) => b.score - a.score);
      return rows.slice(0, limit);
    },

    listUsers() {
      return Object.keys(load().users);
    },
  };

  window.DB = DB;
})();
