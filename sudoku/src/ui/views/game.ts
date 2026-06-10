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
  date?: string;     // for daily mode
  stage?: number;    // for practice mode
  onWin: (result: GameResult) => void;
  onExit: () => void;
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

export function mountGameView(root: HTMLElement, props: GameViewProps): { unmount: () => void } {
  const { puzzle, solution, mode, difficulty } = props;

  // State
  const userBoard: Board = cloneBoard(puzzle);
  const givenMask: boolean[][] = puzzle.map(row => row.map(v => v !== 0));
  const hintMask: boolean[][] = Array.from({ length: 9 }, () => Array(9).fill(false));
  let selected: { r: number; c: number } | null = null;
  let mistakes = 0;
  let hintsLeft = 3;
  const moves: Move[] = [];
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  let timerHandle: number | null = null;
  let gameWon = false;

  const settings = { highlightSame: true, showConflict: true, highlightRelated: true, hideDone: true };

  // DOM
  root.innerHTML = `
    <section class="view view--game">
      <div class="top-bar">
        <button class="icon-btn" id="back-btn" aria-label="Back">←</button>
        <div class="game-stats">
          <span>⏱ <span id="timer">00:00</span></span>
          <span>❌ <span id="mistake-count">0</span></span>
        </div>
        <button class="icon-btn" id="hint-btn" aria-label="Hint">💡<span id="hint-count" style="font-size:11px;margin-left:2px;">3</span></button>
      </div>
      <div id="game-label" style="margin-bottom:12px;font-weight:bold;">
        ${mode === 'daily' ? `Daily · ${difficulty}` : `Practice · ${difficulty}`}
      </div>
      <div id="board" class="board"></div>
      <div id="numpad" class="numpad"></div>
    </section>
  `;

  const boardEl = root.querySelector('#board') as HTMLElement;
  const numpadEl = root.querySelector('#numpad') as HTMLElement;
  const timerEl = root.querySelector('#timer') as HTMLElement;
  const mistakeEl = root.querySelector('#mistake-count') as HTMLElement;
  const hintCountEl = root.querySelector('#hint-count') as HTMLElement;
  const hintBtn = root.querySelector('#hint-btn') as HTMLButtonElement;
  const backBtn = root.querySelector('#back-btn') as HTMLButtonElement;

  function elapsedSeconds(): number {
    return Math.floor((Date.now() - startTime) / 1000);
  }

  function rerender() {
    renderBoard(boardEl, { userBoard, givenMask, hintMask, selected, settings, onCellClick });
    renderNumpad(numpadEl, {
      userBoard, solution, hideDone: settings.hideDone,
      onNumber: placeNumber, onErase: () => placeNumber(0),
    });
  }

  function onCellClick(r: number, c: number) {
    selected = { r, c };
    sfxSelect();
    rerender();
  }

  function placeNumber(n: number) {
    if (!selected || gameWon) return;
    const { r, c } = selected;
    if (givenMask[r][c] || hintMask[r][c]) return;

    if (n === 0) {
      userBoard[r][c] = 0;
      sfxErase();
    } else {
      userBoard[r][c] = n;
      if (n !== solution[r][c]) {
        mistakes++;
        mistakeEl.textContent = String(mistakes);
        sfxError();
      } else {
        sfxPlace();
      }
    }
    moves.push({ r, c, n, t: Date.now() - startTime });
    rerender();
    checkWin();
  }

  function useHint() {
    if (hintsLeft <= 0 || gameWon) return;
    const candidates: { r: number; c: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!givenMask[r][c] && userBoard[r][c] !== solution[r][c]) {
          candidates.push({ r, c });
        }
      }
    }
    if (candidates.length === 0) return;

    let target = candidates[0];
    if (selected) {
      const dist = (a: { r: number; c: number }) =>
        Math.abs(a.r - selected!.r) + Math.abs(a.c - selected!.c);
      candidates.sort((a, b) => dist(a) - dist(b));
      target = candidates[0];
    }

    userBoard[target.r][target.c] = solution[target.r][target.c];
    hintMask[target.r][target.c] = true;
    hintsLeft--;
    hintCountEl.textContent = String(hintsLeft);
    moves.push({ r: target.r, c: target.c, n: solution[target.r][target.c], t: Date.now() - startTime, isHint: true });
    if (hintsLeft <= 0) hintBtn.disabled = true;
    sfxHint();
    selected = target;
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

    props.onWin({
      mode, difficulty,
      timeSeconds, mistakes, hintsUsed, score, moves,
      startedAt,
      completedAt: new Date().toISOString(),
    });
  }

  // Wire up
  hintBtn.addEventListener('click', useHint);
  backBtn.addEventListener('click', () => {
    if (timerHandle) clearInterval(timerHandle);
    props.onExit();
  });

  const onKey = (e: KeyboardEvent) => {
    if (gameWon) return;
    if (e.key >= '1' && e.key <= '9') placeNumber(parseInt(e.key, 10));
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') placeNumber(0);
    else if (selected) {
      const { r, c } = selected;
      if (e.key === 'ArrowUp') { selected = { r: Math.max(0, r - 1), c }; rerender(); }
      else if (e.key === 'ArrowDown') { selected = { r: Math.min(8, r + 1), c }; rerender(); }
      else if (e.key === 'ArrowLeft') { selected = { r, c: Math.max(0, c - 1) }; rerender(); }
      else if (e.key === 'ArrowRight') { selected = { r, c: Math.min(8, c + 1) }; rerender(); }
    }
  };
  document.addEventListener('keydown', onKey);

  timerHandle = window.setInterval(() => {
    timerEl.textContent = formatTime(elapsedSeconds());
  }, 500);

  rerender();

  return {
    unmount() {
      if (timerHandle) clearInterval(timerHandle);
      document.removeEventListener('keydown', onKey);
    },
  };
}
