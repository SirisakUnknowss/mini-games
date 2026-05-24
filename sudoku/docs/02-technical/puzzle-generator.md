# 🎲 Puzzle Generator Spec

> Algorithm สร้าง Sudoku puzzle ที่มี **unique solution** สำหรับ daily mode

## 🎯 Requirements

1. **Unique solution** — ห้ามมีเฉลยมากกว่า 1
2. **Reproducible** — seed เดิม → puzzle เดิม
3. **Difficulty-tuned** — clues ตรง spec
4. **Performant** — generate < 2 วินาทีต่อ puzzle

---

## 🧮 Algorithm Overview

```
Input: seed (number), difficulty (enum)
Output: { puzzle: 81 chars, solution: 81 chars }

Step 1: generateSolvedBoard(seed) → 9×9 solved
Step 2: removeClues(solvedBoard, targetClues, seed) → puzzle
Step 3: countSolutions(puzzle) → must equal 1
        if > 1: backtrack, try different cells
Step 4: serialize → 81-char strings
```

---

## Step 1: Generate Solved Board

ใช้ backtracking + seeded shuffle (เหมือนใน v1)

```ts
function generateSolvedBoard(seed: number): number[][] {
  const rng = seededRng(seed);
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board, rng);
  return board;
}

function fillBoard(board: number[][], rng: () => number): boolean {
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9), c = i % 9;
    if (board[r][c] !== 0) continue;

    const nums = shuffle([1,2,3,4,5,6,7,8,9], rng);
    for (const n of nums) {
      if (isValid(board, r, c, n)) {
        board[r][c] = n;
        if (fillBoard(board, rng)) return true;
        board[r][c] = 0;
      }
    }
    return false;
  }
  return true;
}
```

### Seeded RNG (LCG)
```ts
function seededRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
```

---

## Step 2: Remove Clues (with Uniqueness Check)

⚠️ **ส่วนที่ v1 ขาด** — ต้อง implement ใหม่

```ts
function removeClues(
  solved: number[][],
  targetClues: number,
  seed: number
): number[][] {
  const rng = seededRng(seed + 999);
  const puzzle = solved.map(r => [...r]);
  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => i),
    rng
  );

  let remaining = 81;
  for (const pos of positions) {
    if (remaining <= targetClues) break;

    const r = Math.floor(pos / 9), c = pos % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    if (countSolutions(puzzle, 2) !== 1) {
      // revert — removing this would create ambiguity
      puzzle[r][c] = backup;
    } else {
      remaining--;
    }
  }

  return puzzle;
}
```

**Note:** อาจไม่ถึง `targetClues` ทุกครั้ง — เป็นเรื่องปกติเพราะ uniqueness constraint
ให้ accept clues range: e.g., target 28 → accept 28-33

---

## Step 3: Count Solutions

หัวใจของ uniqueness check — ใช้ solver แต่ **early-exit** เมื่อเจอ 2 เฉลย

```ts
function countSolutions(puzzle: number[][], cap: number = 2): number {
  let count = 0;
  const board = puzzle.map(r => [...r]);

  function solve(): boolean {
    if (count >= cap) return true;  // early exit

    // Find empty cell
    let r = -1, c = -1;
    for (let i = 0; i < 81; i++) {
      const rr = Math.floor(i / 9), cc = i % 9;
      if (board[rr][cc] === 0) {
        r = rr; c = cc;
        break;
      }
    }

    if (r === -1) {
      count++;  // solution found
      return count >= cap;
    }

    for (let n = 1; n <= 9; n++) {
      if (isValid(board, r, c, n)) {
        board[r][c] = n;
        if (solve()) {
          board[r][c] = 0;
          return true;
        }
        board[r][c] = 0;
      }
    }
    return false;
  }

  solve();
  return count;
}
```

**Optimization (สำคัญสำหรับ performance):**
- เลือก empty cell ที่มี candidate น้อยที่สุด (MRV heuristic) → เร็วขึ้น 10×
- Cache row/col/box used digits → ไม่ต้องสแกนทุกรอบ

### Optimized Version
```ts
function countSolutionsOptimized(puzzle: number[][], cap = 2): number {
  const rows = Array(9).fill(0); // bitmask
  const cols = Array(9).fill(0);
  const boxes = Array(9).fill(0);

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const n = puzzle[r][c];
      if (n) {
        const bit = 1 << n;
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[Math.floor(r/3)*3 + Math.floor(c/3)] |= bit;
      }
    }
  }

  const board = puzzle.map(r => [...r]);
  let count = 0;

  function findBestEmpty(): [number, number, number] | null {
    let best: [number, number, number] | null = null;
    let bestCount = 10;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== 0) continue;
        const b = Math.floor(r/3)*3 + Math.floor(c/3);
        const used = rows[r] | cols[c] | boxes[b];
        let cnt = 0;
        for (let n = 1; n <= 9; n++) if (!(used & (1 << n))) cnt++;
        if (cnt < bestCount) {
          bestCount = cnt;
          best = [r, c, used];
          if (cnt === 0) return best;  // dead end
          if (cnt === 1) return best;  // forced
        }
      }
    }
    return best;
  }

  function solve(): boolean {
    if (count >= cap) return true;
    const next = findBestEmpty();
    if (!next) {
      count++;
      return count >= cap;
    }
    const [r, c, used] = next;
    const b = Math.floor(r/3)*3 + Math.floor(c/3);
    for (let n = 1; n <= 9; n++) {
      const bit = 1 << n;
      if (used & bit) continue;
      board[r][c] = n;
      rows[r] |= bit; cols[c] |= bit; boxes[b] |= bit;
      if (solve()) {
        board[r][c] = 0;
        rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
        return true;
      }
      board[r][c] = 0;
      rows[r] &= ~bit; cols[c] &= ~bit; boxes[b] &= ~bit;
    }
    return false;
  }

  solve();
  return count;
}
```

---

## 🎚️ Difficulty Calibration

ระดับ != แค่จำนวน clue — ยังเกี่ยวกับ **technique ที่ใช้**

### Simple: by clues count
| Difficulty | Clues | Source |
|---|---|---|
| Easy | 40-45 | Naked Singles only |
| Easy-Medium | 36-40 | + Hidden Singles |
| Medium | 32-36 | + Naked Pairs |
| Medium-Hard | 28-32 | + Locked Candidates |
| Hard | 25-28 | + Pointing Pairs |
| Hard-Expert | 22-25 | + X-Wing |
| Expert | 19-22 | + Chains |

### Advanced: by technique requirement
**Phase 1 (MVP):** ใช้ clue count อย่างเดียว
**Phase 2+:** เพิ่ม technique-based ranking

#### Technique-based Difficulty Score
```ts
function rateDifficulty(puzzle: number[][]): {
  rating: number,
  techniques: string[]
} {
  // Solve with technique-by-technique
  // Hardest technique used → rating
  // Return list of techniques applied
}
```

อ้างอิง: [Sudokuwiki Solver](https://www.sudokuwiki.org/sudoku.htm)

---

## 📦 Daily Puzzle Generation Flow

```ts
// supabase/functions/generate-daily-puzzle/index.ts
async function generateDailyPuzzles(startDate: Date, count = 30) {
  for (let i = 0; i < count; i++) {
    const date = addDays(startDate, i);
    const dateStr = formatISO(date, { representation: 'date' });

    if (await puzzleExists(dateStr)) continue;

    const difficulty = getDifficultyForDay(date.getUTCDay());
    const clues = TARGET_CLUES[difficulty];

    let attempts = 0;
    let result = null;
    while (attempts < 50 && !result) {
      const seed = hash(dateStr + attempts);
      try {
        const solved = generateSolvedBoard(seed);
        const puzzle = removeClues(solved, clues, seed);
        if (countSolutionsOptimized(puzzle, 2) === 1) {
          result = { solved, puzzle };
        }
      } catch {}
      attempts++;
    }

    if (!result) throw new Error(`Failed to generate ${dateStr}`);

    await db.from('daily_puzzles').insert({
      date: dateStr,
      difficulty,
      clues: countClues(result.puzzle),
      puzzle: serialize(result.puzzle),
      solution: serialize(result.solved),
      solution_hash: sha256(serialize(result.solved)),
      generation_seed: String(hash(dateStr)),
    });
  }
}
```

### Difficulty Schedule
```ts
function getDifficultyForDay(dayOfWeek: number): Difficulty {
  // 0 = Sunday, 1 = Monday, ...
  return [
    'expert',         // Sun
    'easy',           // Mon
    'easy-medium',    // Tue
    'medium',         // Wed
    'medium-hard',    // Thu
    'hard',           // Fri
    'hard-expert',    // Sat
  ][dayOfWeek];
}
```

---

## 🧪 Testing

### Unit Tests
```ts
describe('puzzle generator', () => {
  it('produces unique solutions for all difficulties', () => {
    for (const diff of ALL_DIFFICULTIES) {
      for (let s = 0; s < 10; s++) {
        const { puzzle, solution } = generatePuzzle(diff, s);
        expect(countSolutionsOptimized(parse(puzzle), 2)).toBe(1);
      }
    }
  });

  it('is deterministic with same seed', () => {
    const a = generatePuzzle('medium', 12345);
    const b = generatePuzzle('medium', 12345);
    expect(a.puzzle).toBe(b.puzzle);
  });

  it('clue count is within tolerance', () => {
    const { puzzle } = generatePuzzle('hard', 1);
    const clues = puzzle.split('').filter(c => c !== '0').length;
    expect(clues).toBeGreaterThanOrEqual(25);
    expect(clues).toBeLessThanOrEqual(32);
  });

  it('generates in < 2 seconds', () => {
    const t = Date.now();
    generatePuzzle('expert', 1);
    expect(Date.now() - t).toBeLessThan(2000);
  });
});
```

---

## 🔄 Performance Notes

| Difficulty | Avg gen time | Solver iterations |
|---|---|---|
| Easy | ~50ms | ~100 |
| Medium | ~200ms | ~1k |
| Hard | ~800ms | ~10k |
| Expert | ~1.5s | ~100k |

**ถ้าเกิน 2 วินาที:**
- Switch to WASM (sudoku-wasm libs ระเบิด)
- Pre-compute pool ของ 1000 puzzles per difficulty
- Use proven libraries: `sudoku.js`, `qqwing` (C++ wrapper)

---

## 📚 Alternative: Use Existing Library

แทนเขียนเอง อาจใช้:
- **`sudoku-toolkit`** (npm) — generation + uniqueness check + rating
- **`@aureooms/js-sudoku`** — solver
- **qqwing** — battle-tested C++ → compile WASM

**ข้อดี library:** เร็ว, มี difficulty rating ดีกว่า
**ข้อเสีย:** ขึ้นกับ maintainer, bundle ใหญ่

**คำแนะนำ:** เริ่มด้วยของเขียนเองก่อน (controllable, ไม่มี deps), ถ้า performance ไม่พอ → switch library
