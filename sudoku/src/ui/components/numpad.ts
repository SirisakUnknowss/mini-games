// =====================================================================
// Numpad component
// =====================================================================
import type { Board } from '@engine/types';

export interface NumpadOptions {
  userBoard: Board;
  solution: Board;
  hideDone: boolean;
  onNumber: (n: number) => void;
  onErase: () => void;
}

function countCorrectPlaced(userBoard: Board, solution: Board, n: number): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (userBoard[r][c] === n && solution[r][c] === n) count++;
    }
  }
  return count;
}

export function renderNumpad(container: HTMLElement, opts: NumpadOptions): void {
  container.innerHTML = '';
  container.className = 'numpad';

  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.textContent = String(n);
    btn.dataset.num = String(n);
    if (opts.hideDone && countCorrectPlaced(opts.userBoard, opts.solution, n) === 9) {
      btn.classList.add('done');
    }
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('done')) opts.onNumber(n);
    });
    container.appendChild(btn);
  }

  const erase = document.createElement('button');
  erase.className = 'erase';
  erase.textContent = '⌫';
  erase.addEventListener('click', () => opts.onErase());
  container.appendChild(erase);
}
