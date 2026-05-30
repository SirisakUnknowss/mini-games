// =====================================================================
// 2048 — pure game logic. UI binding lives in app.js.
// Encapsulated as window.Game2048 with no globals leaking.
// =====================================================================
(function () {
  const SIZE = 4;
  const WIN_TILE = 2048;

  function emptyBoard() {
    return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
  }

  function clone(board) {
    return board.map((r) => r.slice());
  }

  function randomEmptyCell(board) {
    const empties = [];
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empties.push([r, c]);
    }
    if (!empties.length) return null;
    return empties[Math.floor(Math.random() * empties.length)];
  }

  function spawn(board) {
    const cell = randomEmptyCell(board);
    if (!cell) return null;
    const value = Math.random() < 0.9 ? 2 : 4;
    board[cell[0]][cell[1]] = value;
    return { row: cell[0], col: cell[1], value };
  }

  /**
   * Slide + merge a single row to the left.
   * Returns { row, gainedScore, mergedAt }.
   * mergedAt is the set of column indices that produced a merge (for animation).
   */
  function slideRowLeft(row) {
    const compact = row.filter((v) => v !== 0);
    const result = [];
    const mergedAt = new Set();
    let gained = 0;
    for (let i = 0; i < compact.length; i++) {
      if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
        const merged = compact[i] * 2;
        result.push(merged);
        gained += merged;
        mergedAt.add(result.length - 1);
        i += 1;
      } else {
        result.push(compact[i]);
      }
    }
    while (result.length < SIZE) result.push(0);
    return { row: result, gainedScore: gained, mergedAt };
  }

  function rotateCw(board) {
    const out = emptyBoard();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      out[c][SIZE - 1 - r] = board[r][c];
    }
    return out;
  }
  function rotateCcw(board) {
    const out = emptyBoard();
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      out[SIZE - 1 - c][r] = board[r][c];
    }
    return out;
  }
  function rotate180(board) {
    return rotateCw(rotateCw(board));
  }

  function boardsEqual(a, b) {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
    return true;
  }

  /**
   * Apply a move ('left' | 'right' | 'up' | 'down').
   * Returns { board, moved, gainedScore, mergedCells:[{row,col}] }.
   */
  function move(board, dir) {
    let work;
    if (dir === 'left')  work = clone(board);
    if (dir === 'right') work = rotate180(board);
    if (dir === 'up')    work = rotateCcw(board);
    if (dir === 'down')  work = rotateCw(board);

    let total = 0;
    const merges = []; // in "left-form" coords

    for (let r = 0; r < SIZE; r++) {
      const { row, gainedScore, mergedAt } = slideRowLeft(work[r]);
      work[r] = row;
      total += gainedScore;
      mergedAt.forEach((c) => merges.push({ r, c }));
    }

    // Map merges back to original orientation
    function unmapCoord(r, c) {
      if (dir === 'left')  return { r, c };
      if (dir === 'right') return { r: SIZE - 1 - r, c: SIZE - 1 - c };
      if (dir === 'up')    return { r: c, c: SIZE - 1 - r };
      if (dir === 'down')  return { r: SIZE - 1 - c, c: r };
      return { r, c };
    }
    const mergedCells = merges.map(({ r, c }) => {
      const { r: rr, c: cc } = unmapCoord(r, c);
      return { row: rr, col: cc };
    });

    let result;
    if (dir === 'left')  result = work;
    if (dir === 'right') result = rotate180(work);
    if (dir === 'up')    result = rotateCw(work);
    if (dir === 'down')  result = rotateCcw(work);

    const moved = !boardsEqual(board, result);
    return { board: result, moved, gainedScore: total, mergedCells };
  }

  function hasMoves(board) {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
    }
    return false;
  }

  function maxTile(board) {
    let m = 0;
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      if (board[r][c] > m) m = board[r][c];
    }
    return m;
  }

  function hasWon(board) { return maxTile(board) >= WIN_TILE; }

  // Public API
  window.Game2048 = {
    SIZE,
    WIN_TILE,
    newBoard() {
      const b = emptyBoard();
      spawn(b); spawn(b);
      return b;
    },
    spawn,
    move,
    hasMoves,
    hasWon,
    maxTile,
    clone,
  };
})();
