// ===== GAME CONSTANTS =====
const SIZE = 8;
const TYPES = ['🍎','🍇','🍋','🍒','🍊','💎'];

// ===== STATE =====
let grid = [];
let selected = null;
let score = 0;
let matches = 0;
let maxCombo = 0;
let busy = false;
let endTime = 0;
let startedAt = 0;
let timerInterval = null;
let gameActive = false;
let durationSec = 300;

// ===== HELPERS =====
function show(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
}
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}
function fmtMinutes(sec) {
  const m = Math.floor(sec / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rand() { return TYPES[Math.floor(Math.random() * TYPES.length)]; }

// ===== LOGIN =====
function renderExistingUsers() {
  const users = DB.listUsers();
  const wrap = document.getElementById('existing-users');
  if (users.length === 0) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = '<div style="width:100%;text-align:center;font-size:13px;opacity:0.7;margin-bottom:6px;">ผู้ใช้ที่มีอยู่:</div>' +
    users.map(u => `<button class="user-chip" data-user="${escapeHtml(u)}">👤 ${escapeHtml(u)}</button>`).join('');
  wrap.querySelectorAll('.user-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('login-username').value = btn.dataset.user;
      document.getElementById('login-password').focus();
    });
  });
}

document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const tab = t.dataset.tab;
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
    document.getElementById('login-err').textContent = '';
    document.getElementById('signup-err').textContent = '';
  });
});

document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;
  const r = DB.login(u, p);
  if (!r.ok) { document.getElementById('login-err').textContent = r.err; return; }
  enterApp();
});
document.getElementById('signup-form').addEventListener('submit', e => {
  e.preventDefault();
  const u = document.getElementById('signup-username').value;
  const p = document.getElementById('signup-password').value;
  const r = DB.signup(u, p);
  if (!r.ok) { document.getElementById('signup-err').textContent = r.err; return; }
  enterApp();
});

function enterApp() {
  const user = DB.getCurrentUser();
  if (!user) { show('view-login'); renderExistingUsers(); return; }
  document.getElementById('user-name').textContent = user.username;
  renderMenu();
  show('view-menu');
}

document.getElementById('logout-btn').addEventListener('click', () => {
  DB.logout();
  document.getElementById('login-form').reset();
  document.getElementById('signup-form').reset();
  renderExistingUsers();
  show('view-login');
});

// ===== MENU =====
function renderMenu() {
  const user = DB.getCurrentUser();
  if (!user) return;
  document.getElementById('user-highscore').textContent = (user.stats?.highScore || 0).toLocaleString();
  document.getElementById('user-plays').textContent = user.stats?.totalPlays || 0;

  const lb = DB.getGlobalLeaderboard(10);
  const tbody = document.getElementById('global-lb');
  if (lb.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty">ยังไม่มีคะแนน</td></tr>';
  } else {
    const medals = ['🥇','🥈','🥉'];
    tbody.innerHTML = lb.map((e, i) => `
      <tr class="${e.name === user.username ? 'me' : ''}">
        <td class="rank">${medals[i] || (i+1)}</td>
        <td>${escapeHtml(e.name)}</td>
        <td class="num">${e.score.toLocaleString()}</td>
      </tr>`).join('');
  }
}

document.getElementById('play-btn').addEventListener('click', () => {
  const user = DB.getCurrentUser();
  durationSec = (user.settings?.durationMin || 5) * 60;
  newGame();
  show('view-game');
});

document.getElementById('back-to-menu-from-game').addEventListener('click', () => {
  if (gameActive && !confirm('ออกเกมตอนนี้? คะแนนรอบนี้จะไม่ถูกบันทึก')) return;
  stopTimer();
  gameActive = false;
  renderMenu();
  show('view-menu');
});

document.getElementById('open-profile').addEventListener('click', () => { renderProfile(); show('view-profile'); });
document.getElementById('open-settings').addEventListener('click', () => { renderSettings(); show('view-settings'); });
document.querySelectorAll('[data-back="menu"]').forEach(b => {
  b.addEventListener('click', () => { renderMenu(); show('view-menu'); });
});

// ===== GAME LOGIC =====
function newGame() {
  score = 0;
  matches = 0;
  maxCombo = 0;
  selected = null;
  busy = false;
  grid = [];
  for (let r = 0; r < SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < SIZE; c++) grid[r][c] = rand();
  }
  while (findMatches().length > 0) {
    for (const [r,c] of findMatches()) grid[r][c] = rand();
  }
  startedAt = Date.now();
  endTime = startedAt + durationSec * 1000;
  gameActive = true;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 250);
  tickTimer();
  updateScoreUI();
  renderBoard();
}

function tickTimer() {
  const remaining = Math.max(0, endTime - Date.now());
  const totalSec = Math.ceil(remaining / 1000);
  document.getElementById('timer').textContent = `เวลา: ${fmtTime(totalSec)}`;
  document.getElementById('timer').classList.toggle('warning', totalSec <= 30);
  if (remaining <= 0 && gameActive) endGame();
}
function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function endGame() {
  gameActive = false;
  stopTimer();
  document.getElementById('timer').classList.remove('warning');
  const duration = Math.floor((Date.now() - startedAt) / 1000);
  const { isNewBest } = DB.recordGame({ score, matches, maxCombo, duration });

  document.getElementById('win-score').textContent = score.toLocaleString();
  document.getElementById('win-matches').textContent = matches;
  document.getElementById('win-maxcombo').textContent = `x${maxCombo}`;
  const user = DB.getCurrentUser();
  document.getElementById('win-best').textContent = isNewBest
    ? '🏆 สถิติใหม่!'
    : `Best: ${(user.stats?.highScore || 0).toLocaleString()}`;
  document.getElementById('win-modal').classList.add('active');
}

document.getElementById('win-again').addEventListener('click', () => {
  document.getElementById('win-modal').classList.remove('active');
  newGame();
});
document.getElementById('win-back').addEventListener('click', () => {
  document.getElementById('win-modal').classList.remove('active');
  renderMenu();
  show('view-menu');
});

function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = grid[r][c] || '';
      if (selected && selected.r === r && selected.c === c) cell.classList.add('selected');
      cell.onclick = () => onCellClick(r, c);
      board.appendChild(cell);
    }
  }
}

function updateScoreUI() {
  document.getElementById('score').textContent = score;
}

function onCellClick(r, c) {
  if (busy || !gameActive) return;
  if (!selected) { selected = { r, c }; renderBoard(); return; }
  if (selected.r === r && selected.c === c) { selected = null; renderBoard(); return; }
  const dr = Math.abs(selected.r - r), dc = Math.abs(selected.c - c);
  if (dr + dc !== 1) { selected = { r, c }; renderBoard(); return; }
  swap(selected, { r, c });
  const m = findMatches();
  if (m.length === 0) {
    swap(selected, { r, c });
    selected = null;
    renderBoard();
    return;
  }
  selected = null;
  processMatches();
}

function swap(a, b) {
  const t = grid[a.r][a.c];
  grid[a.r][a.c] = grid[b.r][b.c];
  grid[b.r][b.c] = t;
}

function findMatches() {
  const set = new Set();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE - 2; c++) {
      const v = grid[r][c];
      if (v && v === grid[r][c+1] && v === grid[r][c+2]) {
        set.add(r+','+c); set.add(r+','+(c+1)); set.add(r+','+(c+2));
        let k = c+3;
        while (k < SIZE && grid[r][k] === v) { set.add(r+','+k); k++; }
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    for (let r = 0; r < SIZE - 2; r++) {
      const v = grid[r][c];
      if (v && v === grid[r+1][c] && v === grid[r+2][c]) {
        set.add(r+','+c); set.add((r+1)+','+c); set.add((r+2)+','+c);
        let k = r+3;
        while (k < SIZE && grid[k][c] === v) { set.add(k+','+c); k++; }
      }
    }
  }
  return [...set].map(s => s.split(',').map(Number));
}

async function processMatches() {
  busy = true;
  const settings = DB.getCurrentUser()?.settings || {};
  let combo = 0;
  while (true) {
    const m = findMatches();
    if (m.length === 0) break;
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    score += m.length * 10 * combo;
    matches += m.length;
    updateScoreUI();
    renderBoard();
    if (settings.animations !== false) {
      const cells = document.getElementById('board').querySelectorAll('.cell');
      for (const [r,c] of m) cells[r*SIZE + c].classList.add('clearing');
      await sleep(300);
    }
    for (const [r,c] of m) grid[r][c] = null;
    dropDown();
    renderBoard();
    if (settings.animations !== false) await sleep(150);
  }
  busy = false;
}

function dropDown() {
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (grid[r][c]) { grid[write][c] = grid[r][c]; if (write !== r) grid[r][c] = null; write--; }
    }
    for (let r = write; r >= 0; r--) grid[r][c] = rand();
  }
}

// ===== PROFILE =====
function renderProfile() {
  const user = DB.getCurrentUser();
  if (!user) return;
  document.getElementById('profile-name').textContent = user.username;
  document.getElementById('profile-since').textContent = 'สมาชิกตั้งแต่ ' + new Date(user.createdAt).toLocaleDateString('th-TH');

  const s = user.stats || {};
  document.getElementById('p-highscore').textContent = (s.highScore || 0).toLocaleString();
  document.getElementById('p-total-score').textContent = (s.totalScore || 0).toLocaleString();
  document.getElementById('p-plays').textContent = s.totalPlays || 0;
  document.getElementById('p-matches').textContent = s.totalMatches || 0;
  document.getElementById('p-maxcombo').textContent = `x${s.maxCombo || 0}`;
  document.getElementById('p-playtime').textContent = fmtMinutes(s.totalPlayTime || 0);

  const tbody = document.getElementById('p-recent');
  const recent = user.recent || [];
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty">ยังไม่มีประวัติ</td></tr>';
  } else {
    tbody.innerHTML = recent.slice(0, 10).map(r => {
      const d = new Date(r.playedAt);
      const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' +
                      d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      return `<tr>
        <td>${dateStr}</td>
        <td class="num">${r.score.toLocaleString()}</td>
        <td class="num">${r.matches}</td>
        <td class="num">x${r.maxCombo}</td>
      </tr>`;
    }).join('');
  }
}

// ===== SETTINGS =====
function renderSettings() {
  const s = { ...DB.DEFAULT_SETTINGS, ...(DB.getCurrentUser()?.settings || {}) };
  document.getElementById('opt-animations').checked = s.animations;
  document.getElementById('opt-duration').value = String(s.durationMin);
}

document.getElementById('opt-animations').addEventListener('change', () => {
  DB.updateSettings({ animations: document.getElementById('opt-animations').checked });
});
document.getElementById('opt-duration').addEventListener('change', () => {
  DB.updateSettings({ durationMin: parseInt(document.getElementById('opt-duration').value, 10) });
});

// ===== PROMPT MODAL =====
function openPrompt({ title, msg, withInput, onOk }) {
  document.getElementById('prompt-title').textContent = title;
  document.getElementById('prompt-msg').textContent = msg || '';
  document.getElementById('prompt-err').textContent = '';
  const input = document.getElementById('prompt-input');
  input.classList.toggle('hidden', !withInput);
  input.value = '';
  document.getElementById('prompt-modal').classList.add('active');
  const okBtn = document.getElementById('prompt-ok');
  const newOk = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOk, okBtn);
  newOk.addEventListener('click', () => {
    const r = onOk(input.value);
    if (r && r.err) document.getElementById('prompt-err').textContent = r.err;
    else document.getElementById('prompt-modal').classList.remove('active');
  });
  if (withInput) setTimeout(() => input.focus(), 50);
}
document.getElementById('prompt-cancel').addEventListener('click', () => {
  document.getElementById('prompt-modal').classList.remove('active');
});

document.getElementById('change-pw-btn').addEventListener('click', () => {
  openPrompt({
    title: 'เปลี่ยนรหัสผ่าน', msg: 'กรอกรหัสผ่านเดิม', withInput: true,
    onOk: (oldPw) => {
      document.getElementById('prompt-modal').classList.remove('active');
      openPrompt({
        title: 'รหัสผ่านใหม่', msg: 'กรอกรหัสผ่านใหม่ (อย่างน้อย 4 ตัว)', withInput: true,
        onOk: (newPw) => {
          const r = DB.changePassword(oldPw, newPw);
          if (!r.ok) return r;
          alert('เปลี่ยนรหัสผ่านสำเร็จ');
        },
      });
    },
  });
});

document.getElementById('reset-progress-btn').addEventListener('click', () => {
  if (!confirm('ล้างสถิติทั้งหมด?')) return;
  DB.resetProgress();
  renderMenu();
  alert('ล้างเรียบร้อย');
});

document.getElementById('delete-account-btn').addEventListener('click', () => {
  if (!confirm('ลบบัญชีนี้ออกถาวร? ข้อมูลทั้งหมดจะหาย')) return;
  DB.deleteAccount();
  show('view-login');
  renderExistingUsers();
});

// ===== INIT =====
renderExistingUsers();
enterApp();
