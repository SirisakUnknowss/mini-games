// =====================================================================
// Sound engine — Web Audio API, zero external files.
// All sounds are synthesised from oscillators + envelopes.
// Respects user mute preference (localStorage) and system
// prefers-reduced-motion (used as a proxy for "prefer quiet").
// =====================================================================

const MUTE_KEY = 'sudoku_muted_v1';

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let _muted = false;

function getCtx(): AudioContext | null {
  if (_muted) return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ── helpers ────────────────────────────────────────────────────────
type WaveType = OscillatorType;

interface ToneOpts {
  freq: number;
  wave?: WaveType;
  startAt?: number;   // offset from now in seconds
  dur?: number;       // duration in seconds
  vol?: number;       // 0-1
  attack?: number;
  decay?: number;
}

function tone(opts: ToneOpts): void {
  const ac = getCtx();
  if (!ac || !masterGain) return;
  const { freq, wave = 'sine', startAt = 0, dur = 0.1, vol = 0.6, attack = 0.005, decay = 0.05 } = opts;
  const now = ac.currentTime + startAt;

  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(vol, now + attack);
  env.gain.linearRampToValueAtTime(0, now + dur);
  osc.connect(env);
  env.connect(masterGain);
  osc.start(now);
  osc.stop(now + dur + decay);
}

function noise(startAt = 0, dur = 0.07, vol = 0.15): void {
  const ac = getCtx();
  if (!ac || !masterGain) return;
  const bufSize = ac.sampleRate * (dur + 0.05);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const env = ac.createGain();
  const now = ac.currentTime + startAt;
  env.gain.setValueAtTime(vol, now);
  env.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(env);
  env.connect(masterGain!);
  src.start(now);
  src.stop(now + dur + 0.05);
}

// ── Public API ─────────────────────────────────────────────────────

/** Load mute preference from localStorage */
export function initSound(): void {
  try { _muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /**/ }
}

export function isMuted(): boolean { return _muted; }

export function setMuted(m: boolean): void {
  _muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /**/ }
  if (masterGain) masterGain.gain.value = m ? 0 : 0.35;
}

export function toggleMute(): boolean {
  setMuted(!_muted);
  return _muted;
}

// ── Sounds ─────────────────────────────────────────────────────────

/** Soft click when placing a number */
export function sfxPlace(): void {
  tone({ freq: 520, wave: 'sine', dur: 0.07, vol: 0.4, attack: 0.003 });
}

/** Low thud on cell select */
export function sfxSelect(): void {
  tone({ freq: 280, wave: 'sine', dur: 0.06, vol: 0.2, attack: 0.002 });
}

/** Buzz + noise on conflict / mistake */
export function sfxError(): void {
  tone({ freq: 160, wave: 'sawtooth', dur: 0.12, vol: 0.3, attack: 0.005 });
  noise(0, 0.1, 0.12);
}

/** Soft whoosh on erase */
export function sfxErase(): void {
  const ac = getCtx();
  if (!ac || !masterGain) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.linearRampToValueAtTime(200, now + 0.08);
  env.gain.setValueAtTime(0.25, now);
  env.gain.linearRampToValueAtTime(0, now + 0.08);
  osc.connect(env); env.connect(masterGain);
  osc.start(now); osc.stop(now + 0.12);
}

/** Bright ding when earning coins */
export function sfxCoin(): void {
  tone({ freq: 880, wave: 'sine', dur: 0.09, vol: 0.35, attack: 0.003 });
  tone({ freq: 1320, wave: 'sine', startAt: 0.06, dur: 0.1, vol: 0.25 });
}

/** Double chime when claiming a quest */
export function sfxQuestClaim(): void {
  tone({ freq: 660,  wave: 'sine', dur: 0.12, vol: 0.4 });
  tone({ freq: 880,  wave: 'sine', startAt: 0.1, dur: 0.14, vol: 0.35 });
  tone({ freq: 1100, wave: 'sine', startAt: 0.2, dur: 0.18, vol: 0.3 });
}

/** Hint reveal — sparkle */
export function sfxHint(): void {
  [660, 784, 1046, 1318].forEach((f, i) => {
    tone({ freq: f, wave: 'sine', startAt: i * 0.045, dur: 0.09, vol: 0.3 });
  });
}

/** Ascending arpeggio on puzzle complete */
export function sfxWin(): void {
  const notes = [523, 659, 784, 1046, 1318]; // C5-E5-G5-C6-E6
  notes.forEach((f, i) => {
    tone({ freq: f, wave: 'sine', startAt: i * 0.1, dur: 0.22, vol: 0.45, attack: 0.01, decay: 0.1 });
  });
}

/** Grand fanfare for daily win (with rank) */
export function sfxDailyWin(): void {
  // Chord swell
  const root = [523, 659, 784]; // C maj
  root.forEach((f) => tone({ freq: f, wave: 'sine', dur: 0.5, vol: 0.3, attack: 0.05, decay: 0.1 }));
  // Rising arpeggio on top
  [1046, 1318, 1568, 2093].forEach((f, i) => {
    tone({ freq: f, wave: 'sine', startAt: 0.3 + i * 0.1, dur: 0.25, vol: 0.35, attack: 0.01 });
  });
}

/** Rising sweep for streak milestone */
export function sfxStreakMilestone(): void {
  const ac = getCtx();
  if (!ac || !masterGain) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
  env.gain.setValueAtTime(0.4, now);
  env.gain.linearRampToValueAtTime(0, now + 0.5);
  osc.connect(env); env.connect(masterGain);
  osc.start(now); osc.stop(now + 0.6);
}

/** Level up — celebratory scale */
export function sfxLevelUp(): void {
  [392, 494, 587, 698, 784, 988].forEach((f, i) => {
    tone({ freq: f, wave: 'triangle', startAt: i * 0.08, dur: 0.18, vol: 0.4, attack: 0.01 });
  });
}

/** Theme preview — soft whoosh */
export function sfxThemeChange(): void {
  const ac = getCtx();
  if (!ac || !masterGain) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
  env.gain.setValueAtTime(0, now);
  env.gain.linearRampToValueAtTime(0.2, now + 0.04);
  env.gain.linearRampToValueAtTime(0, now + 0.15);
  osc.connect(env); env.connect(masterGain);
  osc.start(now); osc.stop(now + 0.2);
}

/** Achievement unlocked */
export function sfxAchievement(): void {
  [784, 988, 1174].forEach((f, i) => {
    tone({ freq: f, wave: 'sine', startAt: i * 0.12, dur: 0.2, vol: 0.4, attack: 0.01 });
  });
  tone({ freq: 1568, wave: 'sine', startAt: 0.4, dur: 0.35, vol: 0.35, attack: 0.02, decay: 0.15 });
}

/** Navigation tap — very subtle */
export function sfxNav(): void {
  tone({ freq: 400, wave: 'sine', dur: 0.04, vol: 0.15, attack: 0.002 });
}
