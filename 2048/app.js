// =====================================================================
// 2048 — UI binding + user/profile/leaderboard wiring
// =====================================================================
(function () {
  // ---- DOM ----
  const views = {
    login: document.getElementById('view-login'),
    home: document.getElementById('view-home'),
    leaderboard: document.getElementById('view-leaderboard'),
    profile: document.getElementById('view-profile'),
  };
  const boardEl = document.getElementById('board');
  const overlayEl = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayBtn = document.getElementById('overlay-action');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const userLabel = document.getElementById('user-label');
  const toastEl = document.getElementById('toast');

  // ---- State ----
  let board = null;
  let score = 0;
  let best = 0;
  let history = []; // for Undo (capped at 1)
  let wonAlready = false;
  let startedAt = 0;

  // ---- Views ----
  function showView(name) {
    Object.values(views).forEach((v) => v.classList.remove('active'));
    views[name].classList.add('active');
  }

  function toast(msg, ms = 1800) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.add('hidden'), ms);
  }

  // ---- Render ----
  function render(spawnedAt, mergedCells) {
    const spawnSet = spawnedAt ? new Set([`${spawnedAt.row},${spawnedAt.col}`]) : new Set();
    const mergeSet = new Set((mergedCells ?? []).map((c) => `${c.row},${c.col}`));
    let html = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = board[r][c];
        const key = `${r},${c}`;
        const classes = ['tile'];
        if (v > 0) classes.push(`v-${v}`);
        if (spawnSet.has(key)) classes.push('t-spawn');
        if (mergeSet.has(key)) classes.push('t-merge');
        html += `<div class="${classes.join(' ')}">${v || ''}</div>`;
      }
    }
    boardEl.innerHTML = html;
    scoreEl.textContent = score.toLocaleString();
    bestEl.textContent = best.toLocaleString();
  }

  function refreshFromUser() {
    const u = DB.getCurrentUser();
    if (!u) return;
    userLabel.textContent = u.username;
    best = u.stats.highScore || 0;
  }

  // ---- Game flow ----
  function newGame(force = false) {
    if (!force) {
      const u = DB.getCurrentUser();
      if (u && u.board) {
        board = u.board.board;
        score = u.board.score;
        wonAlready = u.board.wonAlready;
        startedAt = u.board.startedAt || Date.now();
        history = [];
        render();
        return;
      }
    }
    board = Game2048.newBoard();
    score = 0;
    wonAlready = false;
    history = [];
    startedAt = Date.now();
    overlayEl.classList.remove('active');
    render();
    saveSnapshot();
  }

  function saveSnapshot() {
    DB.saveBoard({ board, score, wonAlready, startedAt });
  }

  function recordIfFinished() {
    if (!board) return;
    const duration = Math.round((Date.now() - startedAt) / 1000);
    DB.recordGame({ score, highestTile: Game2048.maxTile(board), duration });
    DB.saveBoard(null);
    refreshFromUser();
  }

  function tryMove(dir) {
    if (!board) return;
    const prevBoard = Game2048.clone(board);
    const prevScore = score;
    const { board: next, moved, gainedScore, mergedCells } = Game2048.move(board, dir);
    if (!moved) return;
    history = [{ board: prevBoard, score: prevScore, wonAlready }];
    board = next;
    score += gainedScore;
    const spawned = Game2048.spawn(board);
    if (score > best) best = score;
    render(spawned, mergedCells);
    saveSnapshot();

    if (!wonAlready && Game2048.hasWon(board)) {
      wonAlready = true;
      overlayTitle.textContent = '🏆 You won!';
      overlayBtn.textContent = 'Keep going';
      overlayEl.classList.add('active');
      toast('🎉 You hit 2048!');
    } else if (!Game2048.hasMoves(board)) {
      overlayTitle.textContent = '😵 Game over';
      overlayBtn.textContent = 'New game';
      overlayEl.classList.add('active');
      recordIfFinished();
    }
  }

  function undo() {
    if (!history.length) { toast('Nothing to undo'); return; }
    const { board: pb, score: ps, wonAlready: pw } = history.pop();
    board = pb; score = ps; wonAlready = pw;
    overlayEl.classList.remove('active');
    render();
    saveSnapshot();
  }

  // ---- Input ----
  const KEY_MAP = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down',
    h: 'left', l: 'right', k: 'up', j: 'down',
  };
  document.addEventListener('keydown', (e) => {
    if (!views.home.classList.contains('active')) return;
    const dir = KEY_MAP[e.key];
    if (!dir) return;
    e.preventDefault();
    tryMove(dir);
  });

  // Touch swipe
  let touchStart = null;
  boardEl.addEventListener('touchstart', (e) => {
    if (!e.touches.length) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  boardEl.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    if (ax > ay) tryMove(dx > 0 ? 'right' : 'left');
    else         tryMove(dy > 0 ? 'down' : 'up');
  });

  // ---- Auth ----
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const authToggle = document.getElementById('auth-toggle');
  const authError = document.getElementById('auth-error');
  const authUser = document.getElementById('auth-username');
  const authPw = document.getElementById('auth-password');
  let authMode = 'signin';

  function renderAuth() {
    authTitle.textContent = authMode === 'signin' ? 'Sign in' : 'Create account';
    authSubmit.textContent = authMode === 'signin' ? 'Sign in' : 'Sign up';
    authToggle.textContent = authMode === 'signin' ? 'Create an account' : 'I already have an account';
    authError.textContent = '';
  }
  authToggle.addEventListener('click', () => {
    authMode = authMode === 'signin' ? 'signup' : 'signin';
    renderAuth();
  });
  authSubmit.addEventListener('click', () => {
    authError.textContent = '';
    const u = authUser.value.trim();
    const p = authPw.value;
    const r = authMode === 'signin' ? DB.login(u, p) : DB.signup(u, p);
    if (!r.ok) { authError.textContent = r.err; return; }
    afterAuth();
  });
  authPw.addEventListener('keydown', (e) => { if (e.key === 'Enter') authSubmit.click(); });
  authUser.addEventListener('keydown', (e) => { if (e.key === 'Enter') authPw.focus(); });

  function afterAuth() {
    refreshFromUser();
    showView('home');
    newGame();
  }

  // ---- Buttons ----
  document.getElementById('new-game').addEventListener('click', () => {
    if (confirm('Start a new game?')) {
      if (board && score > 0) {
        recordIfFinished();
      }
      newGame(true);
    }
  });
  document.getElementById('undo').addEventListener('click', undo);
  overlayBtn.addEventListener('click', () => {
    if (overlayBtn.textContent === 'New game') {
      newGame(true);
    } else {
      overlayEl.classList.remove('active');
    }
  });

  // Nav
  document.getElementById('nav-leaderboard').addEventListener('click', () => { renderLeaderboard(); showView('leaderboard'); });
  document.getElementById('nav-profile').addEventListener('click', () => { renderProfile(); showView('profile'); });
  document.getElementById('nav-home-from-lb').addEventListener('click', () => showView('home'));
  document.getElementById('nav-profile-from-lb').addEventListener('click', () => { renderProfile(); showView('profile'); });
  document.getElementById('nav-home-from-profile').addEventListener('click', () => showView('home'));
  document.getElementById('nav-leaderboard-from-profile').addEventListener('click', () => { renderLeaderboard(); showView('leaderboard'); });
  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => showView('home'));
  });

  // Profile actions
  document.getElementById('change-pw').addEventListener('click', () => {
    const oldPw = prompt('Current password:'); if (oldPw == null) return;
    const newPw = prompt('New password (min 4):'); if (newPw == null) return;
    const r = DB.changePassword(oldPw, newPw);
    toast(r.ok ? 'Password updated' : r.err);
  });
  document.getElementById('reset-progress').addEventListener('click', () => {
    if (!confirm('Reset all your stats? This cannot be undone.')) return;
    DB.resetProgress();
    refreshFromUser();
    renderProfile();
    newGame(true);
    toast('Progress reset');
  });
  document.getElementById('logout').addEventListener('click', () => {
    DB.logout();
    authUser.value = ''; authPw.value = '';
    showView('login');
  });
  document.getElementById('delete-account').addEventListener('click', () => {
    if (!confirm('Delete your account? This is permanent.')) return;
    DB.deleteAccount();
    authUser.value = ''; authPw.value = '';
    showView('login');
    toast('Account deleted');
  });

  // ---- Leaderboard render ----
  function renderLeaderboard() {
    const me = DB.getCurrentUser()?.username;
    const rows = DB.getGlobalLeaderboard(50);
    const list = document.getElementById('lb-list');
    if (!rows.length) {
      list.innerHTML = `<div class="lb-empty">No scores yet.</div>`;
      return;
    }
    list.innerHTML = rows.map((r, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1);
      const isMe = r.name === me;
      return `
        <div class="lb-row${isMe ? ' me' : ''}">
          <span class="rank">${medal}</span>
          <span class="name">${escapeHtml(r.name)}${isMe ? ' (you)' : ''}</span>
          <span class="score">${(r.score || 0).toLocaleString()}<br><small>max ${r.highestTile}</small></span>
        </div>
      `;
    }).join('');
  }

  function renderProfile() {
    const u = DB.getCurrentUser();
    if (!u) return;
    document.getElementById('p-games').textContent = u.stats.totalPlays;
    document.getElementById('p-score').textContent = u.stats.totalScore.toLocaleString();
    document.getElementById('p-best').textContent = u.stats.highScore.toLocaleString();
    document.getElementById('p-tile').textContent = u.stats.highestTile || '—';
    document.getElementById('p-time').textContent = formatMinutes(u.stats.totalPlayTime);
  }

  function formatMinutes(seconds) {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---- Boot ----
  if (DB.getCurrentUser()) {
    afterAuth();
  } else {
    renderAuth();
    showView('login');
  }
})();
