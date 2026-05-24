// ===== HELPERS =====
function show(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
  document.getElementById(viewId).classList.remove('hidden');
}
function fmtMinutes(sec) {
  const m = Math.floor(sec / 60), h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let inGame = false;

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
  const hb = user.stats?.highestBall || 0;
  document.getElementById('user-highest-ball').textContent = SuikaGame.FRUITS[hb].emoji;

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
  show('view-game');
  startGame();
});

document.getElementById('back-to-menu-from-game').addEventListener('click', () => {
  if (inGame && !confirm('ออกเกมตอนนี้? คะแนนรอบนี้จะไม่ถูกบันทึก')) return;
  SuikaGame.stop();
  inGame = false;
  renderMenu();
  show('view-menu');
});

document.getElementById('open-profile').addEventListener('click', () => { renderProfile(); show('view-profile'); });
document.getElementById('open-settings').addEventListener('click', () => { renderSettings(); show('view-settings'); });
document.querySelectorAll('[data-back="menu"]').forEach(b => {
  b.addEventListener('click', () => { renderMenu(); show('view-menu'); });
});

// ===== START GAME =====
function startGame() {
  inGame = true;
  const user = DB.getCurrentUser();
  const settings = { ...DB.DEFAULT_SETTINGS, ...(user.settings || {}) };
  SuikaGame.start({
    settings,
    onScoreChange: (s) => { document.getElementById('score').textContent = s; },
    onNextChange: (emoji) => { document.getElementById('next').textContent = emoji; },
    onGameOver: ({ score, merges, highestBall, duration }) => {
      inGame = false;
      const { isNewBest } = DB.recordGame({ score, merges, highestBall, duration });
      document.getElementById('win-score').textContent = score.toLocaleString();
      document.getElementById('win-highest').textContent = SuikaGame.FRUITS[highestBall].emoji;
      document.getElementById('win-merges').textContent = merges;
      const cur = DB.getCurrentUser();
      document.getElementById('win-best').textContent = isNewBest
        ? '🏆 สถิติใหม่!'
        : `Best: ${(cur.stats?.highScore || 0).toLocaleString()}`;
      document.getElementById('win-modal').classList.add('active');
    },
  });
}

document.getElementById('win-again').addEventListener('click', () => {
  document.getElementById('win-modal').classList.remove('active');
  startGame();
});
document.getElementById('win-back').addEventListener('click', () => {
  document.getElementById('win-modal').classList.remove('active');
  SuikaGame.stop();
  renderMenu();
  show('view-menu');
});

// ===== PROFILE =====
function renderProfile() {
  const user = DB.getCurrentUser();
  if (!user) return;
  document.getElementById('profile-name').textContent = user.username;
  document.getElementById('profile-since').textContent = 'สมาชิกตั้งแต่ ' + new Date(user.createdAt).toLocaleDateString('th-TH');
  const s = user.stats || {};
  document.getElementById('p-highscore').textContent = (s.highScore || 0).toLocaleString();
  document.getElementById('p-highest-ball').textContent = SuikaGame.FRUITS[s.highestBall || 0].emoji;
  document.getElementById('p-plays').textContent = s.totalPlays || 0;
  document.getElementById('p-merges').textContent = s.totalMerges || 0;
  document.getElementById('p-total-score').textContent = (s.totalScore || 0).toLocaleString();
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
        <td class="num">${SuikaGame.FRUITS[r.highestBall].emoji}</td>
        <td class="num">${r.merges}</td>
      </tr>`;
    }).join('');
  }
}

// ===== SETTINGS =====
function renderSettings() {
  const s = { ...DB.DEFAULT_SETTINGS, ...(DB.getCurrentUser()?.settings || {}) };
  document.getElementById('opt-aim').checked = s.showAim;
  document.getElementById('opt-preview').checked = s.showPreview;
}
document.getElementById('opt-aim').addEventListener('change', () => {
  DB.updateSettings({ showAim: document.getElementById('opt-aim').checked });
});
document.getElementById('opt-preview').addEventListener('change', () => {
  DB.updateSettings({ showPreview: document.getElementById('opt-preview').checked });
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
