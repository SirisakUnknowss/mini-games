// ===== Suika / Ball Merge — Physics + Rendering =====
// Exports window.SuikaGame: { start(opts), stop() }

const FRUITS = [
  { emoji: '🏓', r: 14,  color: '#ff7043', score: 1 },
  { emoji: '🎱', r: 20,  color: '#212121', score: 3 },
  { emoji: '🥎', r: 28,  color: '#fff176', score: 6 },
  { emoji: '⚾', r: 36,  color: '#fafafa', score: 10 },
  { emoji: '🎾', r: 44,  color: '#c0ca33', score: 15 },
  { emoji: '🏐', r: 54,  color: '#eceff1', score: 21 },
  { emoji: '⚽', r: 64,  color: '#ffffff', score: 28 },
  { emoji: '🏀', r: 76,  color: '#e65100', score: 36 },
  { emoji: '🌕', r: 90,  color: '#fff8e1', score: 45 },
  { emoji: '🪩', r: 108, color: '#b0bec5', score: 55 },
  { emoji: '🌎', r: 128, color: '#1976d2', score: 66 },
];

const GRAVITY = 0.4;
const FRICTION = 0.99;
const BOUNCE = 0.3;
const DEAD_LINE = 80;

let canvas, ctx, W, H;
let fruits = [];
let score = 0;
let mergeCount = 0;
let highestBall = 0;
let nextType = 0;
let aimX = 200;
let canDrop = true;
let gameOver = false;
let dangerTime = 0;
let startedAt = 0;
let rafId = 0;
let settings = { showAim: true, showPreview: true };
let onScoreChange = null;
let onNextChange = null;
let onGameOver = null;

function randType() { return Math.floor(Math.random() * 5); }

function spawnFruit(x, y, type, vy = 0) {
  fruits.push({ x, y, vx: 0, vy, type, r: FRUITS[type].r, merged: false, age: 0 });
  if (type > highestBall) highestBall = type;
}

function reset() {
  fruits = [];
  score = 0;
  mergeCount = 0;
  highestBall = 0;
  nextType = randType();
  canDrop = true;
  gameOver = false;
  dangerTime = 0;
  startedAt = Date.now();
  onScoreChange?.(0);
  onNextChange?.(FRUITS[nextType].emoji);
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  aimX = (e.clientX - rect.left) * (W / rect.width);
}
function onMouseClick() {
  if (!canDrop || gameOver) return;
  const t = nextType;
  const r = FRUITS[t].r;
  const x = Math.max(r + 2, Math.min(W - r - 2, aimX));
  spawnFruit(x, 40, t);
  nextType = randType();
  canDrop = false;
  setTimeout(() => canDrop = true, 500);
  onNextChange?.(FRUITS[nextType].emoji);
}

function physics() {
  for (const f of fruits) {
    f.vy += GRAVITY;
    f.vx *= FRICTION;
    f.x += f.vx;
    f.y += f.vy;
    f.age++;
    if (f.x - f.r < 0) { f.x = f.r; f.vx = -f.vx * BOUNCE; }
    if (f.x + f.r > W) { f.x = W - f.r; f.vx = -f.vx * BOUNCE; }
    if (f.y + f.r > H) {
      f.y = H - f.r;
      f.vy = -f.vy * BOUNCE;
      if (Math.abs(f.vy) < 1) f.vy = 0;
    }
  }

  const merges = [];
  const n = fruits.length;
  for (let i = 0; i < n; i++) {
    const a = fruits[i];
    if (!a || a.merged) continue;
    for (let j = i + 1; j < n; j++) {
      const b = fruits[j];
      if (!b || b.merged) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const minDist = a.r + b.r;
      if (dist < minDist && dist > 0) {
        if (a.type === b.type && a.type < FRUITS.length - 1) {
          a.merged = b.merged = true;
          merges.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, type: a.type + 1 });
          break;
        }
        const overlap = minDist - dist;
        const nxn = dx / dist, nyn = dy / dist;
        a.x -= nxn * overlap / 2; a.y -= nyn * overlap / 2;
        b.x += nxn * overlap / 2; b.y += nyn * overlap / 2;
        const dvx = b.vx - a.vx, dvy = b.vy - a.vy;
        const vn = dvx * nxn + dvy * nyn;
        if (vn < 0) {
          const imp = vn * (1 + BOUNCE);
          a.vx += imp * nxn; a.vy += imp * nyn;
          b.vx -= imp * nxn; b.vy -= imp * nyn;
        }
      }
    }
  }
  if (merges.length) {
    fruits = fruits.filter(f => !f.merged);
    for (const m of merges) {
      score += FRUITS[m.type].score;
      mergeCount++;
      spawnFruit(m.x, m.y, m.type);
    }
    onScoreChange?.(score);
  }

  // game over check
  let danger = false;
  for (const f of fruits) {
    if (f.age > 60 && f.y - f.r < DEAD_LINE && Math.abs(f.vy) < 0.5) danger = true;
  }
  if (danger) {
    dangerTime++;
    if (dangerTime > 120 && !gameOver) endNow();
  } else {
    dangerTime = Math.max(0, dangerTime - 2);
  }
}

function endNow() {
  gameOver = true;
  const duration = Math.floor((Date.now() - startedAt) / 1000);
  onGameOver?.({ score, merges: mergeCount, highestBall, duration });
}

function drawFruit(x, y, type, alpha) {
  const f = FRUITS[type];
  ctx.globalAlpha = alpha;
  ctx.fillStyle = f.color;
  ctx.beginPath();
  ctx.arc(x, y, f.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = (f.r * 1.5) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(f.emoji, x, y);
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = dangerTime > 0 ? `rgba(229,57,53,${0.3 + (dangerTime/120)*0.7})` : 'rgba(229,57,53,0.3)';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, DEAD_LINE); ctx.lineTo(W, DEAD_LINE);
  ctx.stroke();
  ctx.setLineDash([]);

  if (canDrop && !gameOver) {
    const r = FRUITS[nextType].r;
    const x = Math.max(r + 2, Math.min(W - r - 2, aimX));
    if (settings.showAim) {
      ctx.strokeStyle = 'rgba(139,90,43,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    if (settings.showPreview) drawFruit(x, 40, nextType, 0.5);
  }

  for (const f of fruits) drawFruit(f.x, f.y, f.type, 1);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('จบเกม!', W/2, H/2 - 10);
    ctx.font = '20px sans-serif';
    ctx.fillText('คะแนน: ' + score, W/2, H/2 + 20);
  }
}

function loop() {
  if (!gameOver) physics();
  draw();
  rafId = requestAnimationFrame(loop);
}

function start(opts) {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  W = canvas.width; H = canvas.height;
  settings = { ...settings, ...(opts.settings || {}) };
  onScoreChange = opts.onScoreChange || null;
  onNextChange = opts.onNextChange || null;
  onGameOver = opts.onGameOver || null;

  canvas.removeEventListener('mousemove', onMouseMove);
  canvas.removeEventListener('click', onMouseClick);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onMouseClick);

  reset();
  if (rafId) cancelAnimationFrame(rafId);
  loop();
}

function stop() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  if (canvas) {
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('click', onMouseClick);
  }
  gameOver = true;
}

function getState() {
  return { score, mergeCount, highestBall, gameOver, highestBallEmoji: FRUITS[highestBall].emoji };
}

window.SuikaGame = { start, stop, getState, FRUITS };
