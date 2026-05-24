// ===== "Database" — localStorage =====
// suika_db_v1 = {
//   currentUser, users: {
//     [username]: {
//       password, createdAt,
//       settings: { showAim, showPreview },
//       stats: { totalPlays, totalScore, totalMerges, totalPlayTime, highScore, highestBall },
//       recent: [ { score, merges, highestBall, duration, playedAt }, ... up to 20 ]
//     }
//   }
// }

const DB_KEY = 'suika_db_v1';
const DEFAULT_SETTINGS = { showAim: true, showPreview: true };

function hashPw(pw) { return btoa(unescape(encodeURIComponent('suika-salt-v1::' + pw))); }

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return { users: {}, currentUser: null };
    const db = JSON.parse(raw);
    if (!db.users) db.users = {};
    return db;
  } catch { return { users: {}, currentUser: null }; }
}
function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function listUsers() { return Object.keys(loadDB().users); }

function signup(username, password) {
  username = (username || '').trim();
  if (!/^[a-zA-Z0-9_฀-๿]{3,20}$/.test(username)) return { ok: false, err: 'ชื่อผู้ใช้ 3-20 ตัว (a-z, 0-9, _, ไทย)' };
  if ((password || '').length < 4) return { ok: false, err: 'รหัสผ่านอย่างน้อย 4 ตัว' };
  const db = loadDB();
  if (db.users[username]) return { ok: false, err: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' };
  db.users[username] = {
    password: hashPw(password),
    createdAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS },
    stats: { totalPlays: 0, totalScore: 0, totalMerges: 0, totalPlayTime: 0, highScore: 0, highestBall: 0 },
    recent: [],
  };
  db.currentUser = username;
  saveDB(db);
  return { ok: true };
}

function login(username, password) {
  const db = loadDB();
  const u = db.users[username];
  if (!u) return { ok: false, err: 'ไม่พบผู้ใช้นี้' };
  if (u.password !== hashPw(password)) return { ok: false, err: 'รหัสผ่านไม่ถูกต้อง' };
  db.currentUser = username;
  saveDB(db);
  return { ok: true };
}

function logout() { const db = loadDB(); db.currentUser = null; saveDB(db); }

function getCurrentUser() {
  const db = loadDB();
  if (!db.currentUser) return null;
  const u = db.users[db.currentUser];
  if (!u) return null;
  return { username: db.currentUser, ...u };
}

function updateUser(fn) {
  const db = loadDB();
  if (!db.currentUser) return;
  const u = db.users[db.currentUser];
  if (!u) return;
  fn(u);
  saveDB(db);
}

function updateSettings(partial) {
  updateUser(u => { u.settings = { ...DEFAULT_SETTINGS, ...u.settings, ...partial }; });
}

function changePassword(oldPw, newPw) {
  const cur = getCurrentUser();
  if (!cur) return { ok: false, err: 'ยังไม่ได้เข้าสู่ระบบ' };
  if (cur.password !== hashPw(oldPw)) return { ok: false, err: 'รหัสผ่านเดิมไม่ถูก' };
  if ((newPw || '').length < 4) return { ok: false, err: 'รหัสผ่านใหม่อย่างน้อย 4 ตัว' };
  updateUser(u => { u.password = hashPw(newPw); });
  return { ok: true };
}

function deleteAccount() {
  const db = loadDB();
  if (!db.currentUser) return;
  delete db.users[db.currentUser];
  db.currentUser = null;
  saveDB(db);
}

function resetProgress() {
  updateUser(u => {
    u.stats = { totalPlays: 0, totalScore: 0, totalMerges: 0, totalPlayTime: 0, highScore: 0, highestBall: 0 };
    u.recent = [];
  });
}

function recordGame({ score, merges, highestBall, duration }) {
  let isNewBest = false;
  updateUser(u => {
    if (!u.stats) u.stats = { totalPlays: 0, totalScore: 0, totalMerges: 0, totalPlayTime: 0, highScore: 0, highestBall: 0 };
    u.stats.totalPlays++;
    u.stats.totalScore += score;
    u.stats.totalMerges += merges;
    u.stats.totalPlayTime += duration;
    if (score > (u.stats.highScore || 0)) { u.stats.highScore = score; isNewBest = true; }
    if (highestBall > (u.stats.highestBall || 0)) u.stats.highestBall = highestBall;
    if (!u.recent) u.recent = [];
    u.recent.unshift({ score, merges, highestBall, duration, playedAt: new Date().toISOString() });
    if (u.recent.length > 20) u.recent.length = 20;
  });
  return { isNewBest };
}

function getGlobalLeaderboard(limit = 10) {
  const db = loadDB();
  const list = [];
  for (const [name, u] of Object.entries(db.users)) {
    if (u.stats?.highScore > 0) list.push({ name, score: u.stats.highScore });
  }
  list.sort((a, b) => b.score - a.score);
  return list.slice(0, limit);
}

window.DB = {
  DEFAULT_SETTINGS, listUsers, signup, login, logout,
  getCurrentUser, updateSettings, changePassword,
  deleteAccount, resetProgress, recordGame, getGlobalLeaderboard,
};
