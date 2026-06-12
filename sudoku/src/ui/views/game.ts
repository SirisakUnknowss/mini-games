// =====================================================================
// Game view — plays a single Sudoku puzzle (daily or practice)
// =====================================================================
import type { Board, Difficulty, Move } from '@engine/types';
import { cloneBoard, boardsEqual } from '@engine/validator';
import { computeDailyScore, computePracticeScore } from '@engine/scoring';
import { renderBoard } from '@ui/components/board';
import { renderNumpad } from '@ui/components/numpad';
import { formatTime } from '@lib/format';
import { sfxPlace, sfxSelect, sfxError, sfxErase, sfxHint, sfxWin, sfxDailyWin } from '@lib/sound';

export interface GameViewProps {
  mode: 'daily' | 'practice';
  difficulty: Difficulty;
  puzzle: Board;
  solution: Board;
  date?: string;
  stage?: number;
  onWin: (result: GameResult) => void;
  onExit: () => void;
  onNewGame?: () => void;
}

export interface GameResult {
  mode: 'daily' | 'practice';
  difficulty: Difficulty;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  score: number;
  moves: Move[];
  startedAt: string;
  completedAt: string;
}

interface HistoryEntry {
  r: number; c: number;
  prevDigit: number; nextDigit: number;
  prevNotes: number[]; nextNotes: number[];
  mistakesDelta: number;
}

const DIFF_COLOR: Record<string, string> = {
  easy: '#10b981',
  medium: '#6c5ce7',
  'medium-hard': '#f59e0b',
  hard: '#f87171',
  expert: '#a78bfa',
};

export function mountGameView(root: HTMLElement, props: GameViewProps): { unmount: () => void } {
  const { puzzle, solution, mode, difficulty } = props;

  // State
  const userBoard: Board = cloneBoard(puzzle);
  const givenMask: boolean[][] = puzzle.map(row => row.map(v => v !== 0));
  const hintMask: boolean[][] = Array.from({ length: 9 }, () => Array(9).fill(false));
  const noteMask: Set<number>[][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>()));

  let selected: { r: number; c: number } | null = null;
  let mistakes = 0;
  let hintsLeft = 3;
  let noteMode = false;
  const moves: Move[] = [];
  const history: HistoryEntry[] = [];
  const future: HistoryEntry[] = [];
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let timerHandle: number | null = null;
  let gameWon = false;

  const settings = { highlightSame: true, showConflict: true, highlightRelated: true };
  const dotColor = DIFF_COLOR[difficulty] ?? '#6c5ce7';
  const diffLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).replace('-', '-');

  // DOM
  root.innerHTML = `
    <section class="view view--game">
      <div class="game-card">
        <div class="game-topbar">
          ${mode === 'daily'
            ? `<div class="mode-pill no-click">
                <span class="mode-dot" style="background:${dotColor}"></span>
                <span>Daily Puzzle</span>
               </div>`
            : `<button class="mode-pill" id="mode-pill-btn">
                <span class="mode-dot" style="background:${dotColor}"></span>
                <span id="mode-pill-label">${diffLabel}</span>
               </button>`
          }
          <div class="topbar-right">
            <div class="game-stats-row">
              <div class="stat-block">
                <span class="stat-label">MISTAKES</span>
                <span class="stat-value"><span id="mistake-count">0</span>/3</span>
              </div>
              <div class="stat-block">
                <span class="stat-label">TIME</span>
                <span class="stat-value" id="timer">00:00</span>
              </div>
            </div>
            <button class="topbar-icon-btn" id="menu-btn" title="Menu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="board-wrap">
          <div id="board" class="board"></div>
          <div class="board-overlay" id="board-overlay">
            <div class="board-menu">
              <button class="board-menu-btn board-menu-btn--resume" id="overlay-resume">Resume</button>
              ${mode !== 'daily' ? `<button class="board-menu-btn board-menu-btn--new" id="overlay-new">New Game</button>` : ''}
              <button class="board-menu-btn board-menu-btn--leave" id="overlay-leave">Leave Game</button>
            </div>
          </div>
          <div class="board-overlay board-gameover" id="gameover-overlay">
            <div class="board-menu">
              <div class="gameover-title">Game Over</div>
              <div class="gameover-sub">3 mistakes — better luck next time!</div>
              <button class="board-menu-btn board-menu-btn--new" id="gameover-new">New Game</button>
              <button class="board-menu-btn board-menu-btn--leave" id="gameover-leave">Leave Game</button>
            </div>
          </div>
        </div>

        <div class="action-bar">
          <button class="action-btn" id="undo-btn" disabled>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7v6h6"/><path d="M3 13C5 8.3 9.1 5 14 5a9 9 0 0 1 0 18c-3.5 0-6.6-2-8.3-5"/>
            </svg>
            <span>Undo</span>
          </button>
          <button class="action-btn" id="redo-btn" disabled>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 7v6h-6"/><path d="M21 13C19 8.3 14.9 5 10 5a9 9 0 0 0 0 18c3.5 0 6.6-2 8.3-5"/>
            </svg>
            <span>Redo</span>
          </button>
          <button class="action-btn action-btn--erase" id="erase-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 20H7L3 16l13-13 5 5-2.5 2.5M6.5 17.5l5-5"/>
            </svg>
            <span>Erase</span>
          </button>
          <button class="action-btn" id="notes-btn">
            <div class="notes-btn-inner">
              <span class="notes-badge" id="notes-badge">OFF</span>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </div>
            <span>Notes</span>
          </button>
          <button class="action-btn" id="hint-btn">
            <div class="hint-btn-inner">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              <span class="hint-count-badge" id="hint-count">3</span>
            </div>
            <span>Hint</span>
          </button>
        </div>

        <div id="numpad" class="numpad"></div>
      </div>
      <a href="https://www.facebook.com/10Hands" target="_blank" rel="noopener noreferrer" class="game-footer">Developed by Unknowss</a>
    </section>
  `;

  const boardEl    = root.querySelector('#board') as HTMLElement;
  const numpadEl   = root.querySelector('#numpad') as HTMLElement;
  const timerEl    = root.querySelector('#timer') as HTMLElement;
  const mistakeEl  = root.querySelector('#mistake-count') as HTMLElement;
  const hintCountEl = root.querySelector('#hint-count') as HTMLElement;
  const hintBtn    = root.querySelector('#hint-btn') as HTMLButtonElement;
  const undoBtn    = root.querySelector('#undo-btn') as HTMLButtonElement;
  const redoBtn    = root.querySelector('#redo-btn') as HTMLButtonElement;
  const eraseBtn   = root.querySelector('#erase-btn') as HTMLButtonElement;
  const notesBtn   = root.querySelector('#notes-btn') as HTMLButtonElement;
  const notesBadge = root.querySelector('#notes-badge') as HTMLElement;

  function elapsedSeconds(): number {
    return Math.floor((Date.now() - startTime) / 1000);
  }

  function syncUndoRedo() {
    undoBtn.disabled = history.length === 0;
    redoBtn.disabled = future.length === 0;
  }

  function rerender() {
    renderBoard(boardEl, { userBoard, givenMask, hintMask, noteMask, selected, settings, onCellClick });
    renderNumpad(numpadEl, { userBoard, solution, onNumber: handleNumber });
  }

  function onCellClick(r: number, c: number) {
    selected = { r, c };
    sfxSelect();
    rerender();
  }

  function notesSnapshot(r: number, c: number): number[] {
    return Array.from(noteMask[r][c]);
  }

  function handleNumber(n: number) {
    if (gameWon || !selected) return;
    const { r, c } = selected;
    if (givenMask[r][c] || hintMask[r][c]) return;

    if (noteMode) {
      const prevNotes = notesSnapshot(r, c);
      const set = noteMask[r][c];
      if (set.has(n)) set.delete(n); else set.add(n);
      const nextNotes = notesSnapshot(r, c);
      history.push({ r, c, prevDigit: userBoard[r][c], nextDigit: userBoard[r][c], prevNotes, nextNotes, mistakesDelta: 0 });
      future.length = 0;
      syncUndoRedo();
      rerender();
      return;
    }

    const prevDigit = userBoard[r][c];
    const prevNotes = notesSnapshot(r, c);
    let mistakesDelta = 0;

    userBoard[r][c] = n;
    noteMask[r][c].clear();

    if (n !== solution[r][c]) {
      mistakes++;
      mistakeEl.textContent = String(mistakes);
      mistakesDelta = 1;
      sfxError();
      if (mistakes >= 3) {
        history.push({ r, c, prevDigit, nextDigit: n, prevNotes, nextNotes: [], mistakesDelta });
        future.length = 0;
        syncUndoRedo();
        moves.push({ r, c, n, t: Date.now() - startTime });
        rerender();
        triggerGameOver();
        return;
      }
    } else {
      sfxPlace();
      // Clear same number from related cells' notes
      for (let i = 0; i < 9; i++) {
        noteMask[r][i].delete(n);
        noteMask[i][c].delete(n);
      }
      const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (let dr = 0; dr < 3; dr++) for (let dc = 0; dc < 3; dc++) noteMask[br+dr][bc+dc].delete(n);
    }

    history.push({ r, c, prevDigit, nextDigit: n, prevNotes, nextNotes: [], mistakesDelta });
    future.length = 0;
    syncUndoRedo();
    moves.push({ r, c, n, t: Date.now() - startTime });
    rerender();
    checkWin();
  }

  function eraseCell() {
    if (gameWon || !selected) return;
    const { r, c } = selected;
    if (givenMask[r][c] || hintMask[r][c]) return;
    const prevDigit = userBoard[r][c];
    const prevNotes = notesSnapshot(r, c);
    if (prevDigit === 0 && noteMask[r][c].size === 0) return;
    userBoard[r][c] = 0;
    noteMask[r][c].clear();
    history.push({ r, c, prevDigit, nextDigit: 0, prevNotes, nextNotes: [], mistakesDelta: 0 });
    future.length = 0;
    syncUndoRedo();
    sfxErase();
    rerender();
  }

  function undoMove() {
    if (history.length === 0) return;
    const entry = history.pop()!;
    future.push(entry);
    userBoard[entry.r][entry.c] = entry.prevDigit;
    noteMask[entry.r][entry.c] = new Set(entry.prevNotes);
    if (entry.mistakesDelta > 0) {
      mistakes = Math.max(0, mistakes - entry.mistakesDelta);
      mistakeEl.textContent = String(mistakes);
    }
    syncUndoRedo();
    rerender();
  }

  function redoMove() {
    if (future.length === 0) return;
    const entry = future.pop()!;
    history.push(entry);
    userBoard[entry.r][entry.c] = entry.nextDigit;
    noteMask[entry.r][entry.c] = new Set(entry.nextNotes);
    if (entry.mistakesDelta > 0) {
      mistakes += entry.mistakesDelta;
      mistakeEl.textContent = String(mistakes);
    }
    syncUndoRedo();
    rerender();
  }

  function useHint() {
    if (hintsLeft <= 0 || gameWon) return;
    const candidates: { r: number; c: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!givenMask[r][c] && userBoard[r][c] !== solution[r][c]) candidates.push({ r, c });
      }
    }
    if (candidates.length === 0) return;

    let target = candidates[0];
    if (selected) {
      candidates.sort((a, b) =>
        (Math.abs(a.r - selected!.r) + Math.abs(a.c - selected!.c)) -
        (Math.abs(b.r - selected!.r) + Math.abs(b.c - selected!.c)));
      target = candidates[0];
    }

    userBoard[target.r][target.c] = solution[target.r][target.c];
    noteMask[target.r][target.c].clear();
    hintMask[target.r][target.c] = true;
    hintsLeft--;
    hintCountEl.textContent = String(hintsLeft);
    if (hintsLeft <= 0) hintBtn.disabled = true;
    sfxHint();
    selected = target;
    moves.push({ r: target.r, c: target.c, n: solution[target.r][target.c], t: Date.now() - startTime, isHint: true });
    history.length = 0;
    future.length = 0;
    syncUndoRedo();
    rerender();
    checkWin();
  }

  function checkWin() {
    if (!boardsEqual(userBoard, solution)) return;
    gameWon = true;
    if (timerHandle) clearInterval(timerHandle);

    const timeSeconds = elapsedSeconds();
    const hintsUsed = 3 - hintsLeft;
    const scoreInput = { difficulty, timeSeconds, mistakes, hintsUsed };
    const score = mode === 'daily'
      ? computeDailyScore(scoreInput).score
      : computePracticeScore(scoreInput);

    if (mode === 'daily') sfxDailyWin(); else sfxWin();

    props.onWin({ mode, difficulty, timeSeconds, mistakes, hintsUsed, score, moves, startedAt, completedAt: new Date().toISOString() });
  }

  function triggerGameOver() {
    gameWon = true;
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    const overlay = root.querySelector('#gameover-overlay') as HTMLElement;
    overlay.classList.add('open');
  }

  // Hamburger menu overlay
  const boardOverlay = root.querySelector('#board-overlay') as HTMLElement;

  function openMenu() {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    boardOverlay.classList.add('open');
  }

  function closeMenu() {
    boardOverlay.classList.remove('open');
    if (!gameWon) timerHandle = window.setInterval(() => { timerEl.textContent = formatTime(elapsedSeconds()); }, 500);
  }

  root.querySelector('#menu-btn')?.addEventListener('click', openMenu);
  root.querySelector('#overlay-resume')?.addEventListener('click', closeMenu);
  root.querySelector('#overlay-new')?.addEventListener('click', () => {
    if (timerHandle) clearInterval(timerHandle);
    if (props.onNewGame) props.onNewGame(); else props.onExit();
  });
  root.querySelector('#overlay-leave')?.addEventListener('click', () => {
    if (timerHandle) clearInterval(timerHandle);
    props.onExit();
  });
  root.querySelector('#gameover-new')?.addEventListener('click', () => {
    if (props.onNewGame) props.onNewGame(); else props.onExit();
  });
  root.querySelector('#gameover-leave')?.addEventListener('click', () => props.onExit());

  hintBtn.addEventListener('click', useHint);
  undoBtn.addEventListener('click', undoMove);
  redoBtn.addEventListener('click', redoMove);
  eraseBtn.addEventListener('click', eraseCell);

  notesBtn.addEventListener('click', () => {
    noteMode = !noteMode;
    notesBtn.classList.toggle('action-btn--notes-on', noteMode);
    notesBadge.textContent = noteMode ? 'ON' : 'OFF';
    notesBadge.classList.toggle('on', noteMode);
  });

  const onKey = (e: KeyboardEvent) => {
    if (gameWon) return;
    if (e.key >= '1' && e.key <= '9') handleNumber(parseInt(e.key, 10));
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') eraseCell();
    else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undoMove(); }
    else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); redoMove(); }
    else if (selected) {
      const { r, c } = selected;
      if      (e.key === 'ArrowUp')    { selected = { r: Math.max(0, r - 1), c }; rerender(); }
      else if (e.key === 'ArrowDown')  { selected = { r: Math.min(8, r + 1), c }; rerender(); }
      else if (e.key === 'ArrowLeft')  { selected = { r, c: Math.max(0, c - 1) }; rerender(); }
      else if (e.key === 'ArrowRight') { selected = { r, c: Math.min(8, c + 1) }; rerender(); }
    }
  };
  document.addEventListener('keydown', onKey);

  timerHandle = window.setInterval(() => {
    timerEl.textContent = formatTime(elapsedSeconds());
  }, 500);

  rerender();
  syncUndoRedo();

  return {
    unmount() {
      if (timerHandle) clearInterval(timerHandle);
      document.removeEventListener('keydown', onKey);
    },
  };
}
