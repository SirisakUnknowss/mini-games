// =====================================================================
// Board component — renders 9×9 Sudoku grid
// =====================================================================
import type { Board } from '@engine/types';
import { hasConflict } from '@engine/validator';

export interface BoardRenderOptions {
  userBoard: Board;
  givenMask: boolean[][];
  hintMask: boolean[][];
  selected: { r: number; c: number } | null;
  settings: {
    highlightSame: boolean;
    showConflict: boolean;
    highlightRelated: boolean;
  };
  onCellClick: (r: number, c: number) => void;
}

export function renderBoard(container: HTMLElement, opts: BoardRenderOptions): void {
  container.innerHTML = '';
  container.className = 'board';

  const { userBoard, givenMask, hintMask, selected, settings, onCellClick } = opts;
  const selVal = selected ? userBoard[selected.r][selected.c] : 0;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      const v = userBoard[r][c];
      if (v !== 0) cell.textContent = String(v);

      if (givenMask[r][c]) cell.classList.add('given');
      else if (hintMask[r][c]) cell.classList.add('hint');
      else if (v !== 0) cell.classList.add('user');

      if (selected) {
        if (selected.r === r && selected.c === c) cell.classList.add('selected');
        else if (
          settings.highlightRelated && (
            selected.r === r ||
            selected.c === c ||
            (Math.floor(selected.r / 3) === Math.floor(r / 3) &&
             Math.floor(selected.c / 3) === Math.floor(c / 3))
          )
        ) cell.classList.add('related');

        if (
          settings.highlightSame &&
          selVal !== 0 && v === selVal &&
          !(selected.r === r && selected.c === c)
        ) cell.classList.add('same-num');
      }

      if (
        settings.showConflict &&
        v !== 0 && !givenMask[r][c] && !hintMask[r][c] &&
        hasConflict(userBoard, r, c)
      ) cell.classList.add('conflict');

      cell.addEventListener('click', () => onCellClick(r, c));
      container.appendChild(cell);
    }
  }
}
