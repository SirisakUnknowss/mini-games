// =====================================================================
// Numpad component — 3×3 grid, shows remaining count
// =====================================================================
import type { Board } from '@engine/types';

export interface NumpadOptions {
  userBoard: Board;
  solution: Board;
  onNumber: (n: number) => void;
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
    const placed = countCorrectPlaced(opts.userBoard, opts.solution, n);
    const remaining = 9 - placed;

    const btn = document.createElement('button');
    btn.dataset.num = String(n);
    if (remaining === 0) btn.classList.add('done');

    const numSpan = document.createElement('span');
    numSpan.className = 'numpad-num';
    numSpan.textContent = String(n);

    const countSpan = document.createElement('span');
    countSpan.className = 'numpad-count';
    countSpan.textContent = remaining > 0 ? String(remaining) : '';

    btn.appendChild(numSpan);
    btn.appendChild(countSpan);

    btn.addEventListener('click', () => {
      if (!btn.classList.contains('done')) opts.onNumber(n);
    });
    container.appendChild(btn);
  }
}
