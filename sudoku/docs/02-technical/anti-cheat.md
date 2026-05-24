# 🛡️ Anti-cheat

> Leaderboard fairness — ทุก score/quest/transaction ต้อง server-validated

## 🎯 Threat Model

### What we protect against
- ✅ Client modifying score before submit
- ✅ Client submitting fake completion (didn't actually play)
- ✅ Client modifying coin balance
- ✅ Replay attacks
- ✅ Time manipulation (claiming impossibly fast)
- ✅ Bot/automation

### What we **don't** protect against (out of scope)
- ❌ Friend playing for you (impossible to detect)
- ❌ Pre-solving on paper then typing fast (acceptable, "real human")
- ❌ Sophisticated bot reverse-engineering protocol (low ROI to defend)

**Philosophy:** Make casual cheating impossible, sophisticated cheating not worth it

---

## 🔒 Validation Layers

### Layer 1: RLS (Database)
- ทุก mutation table ปิด `INSERT/UPDATE` ตรงจาก client
- Only Edge Functions (with `SECURITY DEFINER`) can mutate
- Client read-only ผ่าน `SELECT` policies

### Layer 2: Edge Functions
- ทุก action ผ่าน function
- Function ตรวจ payload + recompute + insert

### Layer 3: Replay Verification
- Client ส่ง move log
- Server replay → ตรวจว่าจบจริง

### Layer 4: Sanity Checks
- Time range, mistakes range, hint range
- Movement timing (ไม่เร็วเกินมนุษย์)

### Layer 5: Statistical Detection (Phase 2+)
- Outlier detection — score เกิน 99.9% percentile → flag
- Pattern detection — submission time pattern

---

## 🎬 Move Recording Format

ระหว่างเล่น client บันทึก:

```ts
interface Move {
  r: 0-8;
  c: 0-8;
  n: 0-9;          // 0 = erase
  t: number;       // ms since game start
  isHint?: boolean;
}

interface SubmissionPayload {
  date: string;
  started_at: string;     // ISO
  completed_at: string;
  time_seconds: number;
  mistakes: number;
  hints_used: number;
  moves: Move[];
  client_version: string;
  device_info?: object;
}
```

---

## ✅ Validation Algorithm

```ts
// supabase/functions/submit-daily-score/index.ts
async function validateSubmission(payload: SubmissionPayload, userId: string) {
  // === 1. Schema validation ===
  if (!isValidPayload(payload)) reject('INVALID_PAYLOAD');

  // === 2. Fetch puzzle ===
  const puzzle = await getDailyPuzzle(payload.date);
  if (!puzzle) reject('PUZZLE_NOT_FOUND');

  // === 3. Time checks ===
  const startMs = new Date(payload.started_at).getTime();
  const endMs = new Date(payload.completed_at).getTime();
  const reportedSeconds = payload.time_seconds;
  const actualSeconds = Math.floor((endMs - startMs) / 1000);

  // Cross-check: reported time matches actual elapsed
  if (Math.abs(actualSeconds - reportedSeconds) > 5) {
    reject('TIME_MISMATCH');
  }

  // Time must be > minimum
  const minTime = MIN_TIME_BY_DIFFICULTY[puzzle.difficulty];
  if (reportedSeconds < minTime) reject('TOO_FAST');

  // Time must be < maximum (anti-AFK score)
  if (reportedSeconds > 3 * 60 * 60) reject('TOO_SLOW');  // 3 hours

  // === 4. Move count sanity ===
  // Min moves to solve = empty cells, max = empty * 5 (lots of erase/retry)
  const emptyCells = 81 - puzzle.clues;
  if (payload.moves.length < emptyCells - 3) reject('INSUFFICIENT_MOVES');
  if (payload.moves.length > emptyCells * 10) reject('TOO_MANY_MOVES');

  // === 5. Replay verification ===
  const board = parsePuzzle(puzzle.puzzle);
  const solution = parsePuzzle(puzzle.solution);
  let mistakeCount = 0;
  let hintCount = 0;
  let prevTime = 0;

  for (const move of payload.moves) {
    // Move within board
    if (move.r < 0 || move.r > 8 || move.c < 0 || move.c > 8) reject('INVALID_MOVE');
    if (move.n < 0 || move.n > 9) reject('INVALID_MOVE');

    // Time must be monotonic
    if (move.t < prevTime) reject('TIME_NON_MONOTONIC');
    if (move.t > reportedSeconds * 1000 + 1000) reject('MOVE_AFTER_END');
    prevTime = move.t;

    // Can't modify given cells
    if (puzzle.puzzle[move.r * 9 + move.c] !== '0' && !move.isHint) {
      reject('MODIFIED_GIVEN');
    }

    if (move.isHint) hintCount++;
    if (move.n !== 0 && move.n !== solution[move.r][move.c]) mistakeCount++;

    board[move.r][move.c] = move.n;
  }

  // === 6. Final state matches solution ===
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c]) reject('SOLUTION_MISMATCH');
    }
  }

  // === 7. Reported counts match replay ===
  if (Math.abs(mistakeCount - payload.mistakes) > 0) reject('MISTAKE_COUNT_MISMATCH');
  if (hintCount !== payload.hints_used) reject('HINT_COUNT_MISMATCH');
  if (hintCount > 3) reject('TOO_MANY_HINTS');

  // === 8. Movement timing (anti-bot) ===
  // เฉลี่ย move ทุกๆ N ms — มนุษย์ปกติ ~500-3000ms/move
  const moveIntervals = [];
  for (let i = 1; i < payload.moves.length; i++) {
    moveIntervals.push(payload.moves[i].t - payload.moves[i-1].t);
  }
  const avgInterval = avg(moveIntervals);
  const stddev = stdDev(moveIntervals);

  // Bot: ทุก move ห่างเท่ากันเป๊ะ → stddev ต่ำมาก
  if (stddev < 50 && payload.moves.length > 20) {
    flag('SUSPICIOUS_TIMING', userId, payload);
    // Don't reject, just flag for review
  }

  // Too fast moves (faster than humanly possible)
  const fastMoves = moveIntervals.filter(i => i < 100);  // < 100ms between moves
  if (fastMoves.length > payload.moves.length * 0.3) {
    reject('INHUMAN_SPEED');
  }

  // === 9. Compute score (NOT from client) ===
  const score = computeDailyScore({
    difficulty: puzzle.difficulty,
    time_seconds: reportedSeconds,
    mistakes: mistakeCount,
    hints_used: hintCount,
  });

  return { valid: true, score, mistakeCount, hintCount };
}
```

---

## ⏱️ Minimum Times (seconds)

```ts
const MIN_TIME_BY_DIFFICULTY = {
  'easy': 45,
  'easy-medium': 70,
  'medium': 100,
  'medium-hard': 130,
  'hard': 160,
  'hard-expert': 200,
  'expert': 240,
};
```

**Reference:** World records ที่เปิดเผย
- Sudoku ปกติ: ~1.5 นาที (90 sec) สำหรับ medium
- ใช้เกินกึ่งหนึ่งของ WR เป็น min ที่ acceptable

---

## 🚨 Flagging vs Rejecting

### Reject (block submission)
- Hard cheats: invalid moves, modified given, solution mismatch
- Impossible time
- Mismatched counts

### Flag (allow but review)
- Suspicious timing (uniform intervals)
- Score top 0.01% (manual review)
- Many submissions from same IP
- Fast for first-time user (no learning curve)

```sql
CREATE TABLE flagged_submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  submission_id BIGINT,
  flag_reason TEXT,
  payload JSONB,
  reviewed BOOLEAN DEFAULT false,
  action TEXT,  -- 'kept', 'removed', 'banned'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🎯 Coin/Item Anti-cheat

### Coin grant
- ห้าม client เรียก "บวกเงิน" ตรงๆ
- ทุก grant ผ่าน Edge Function ที่ verify event ที่ trigger

### Shop purchase
```ts
async function purchase(itemId: string, userId: string) {
  return db.transaction(async tx => {
    // Lock wallet row
    const wallet = await tx.from('user_wallet')
      .select()
      .eq('user_id', userId)
      .forUpdate()
      .single();

    // Check already owns
    const owned = await tx.from('user_inventory')
      .select()
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();
    if (owned) reject('ALREADY_OWNED');

    // Get price
    const item = await tx.from('shop_items')
      .select()
      .eq('id', itemId)
      .eq('available', true)
      .single();
    if (!item) reject('ITEM_NOT_FOUND');

    // Check balance
    if (wallet.coins < item.price_coin) reject('INSUFFICIENT_FUNDS');

    // Deduct
    await tx.from('user_wallet')
      .update({
        coins: wallet.coins - item.price_coin,
        total_spent: wallet.total_spent + item.price_coin,
      })
      .eq('user_id', userId);

    // Add inventory
    await tx.from('user_inventory').insert({
      user_id: userId,
      item_id: itemId,
      acquired_from: 'shop',
    });

    // Log
    await tx.from('coin_transactions').insert({
      user_id: userId,
      amount: -item.price_coin,
      reason: 'shop_purchase',
      metadata: { item_id: itemId },
      balance_after: wallet.coins - item.price_coin,
    });
  });
}
```

---

## 🔍 Monitoring

### Metrics to track
- `flagged_submissions_per_day`
- `rejected_submissions_by_reason`
- `top_10_score_distribution` (should look like normal distribution)
- `submission_time_distribution`

### Alerts
- > 50 flagged submissions/day → investigate
- Single user > 10 flags → manual review
- Repeat offenders → temp ban → permanent ban

---

## 🚫 Banning

```sql
ALTER TABLE profiles ADD COLUMN banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN ban_reason TEXT;

-- Banned users can still log in but submissions rejected
```

```ts
// In Edge Function
if (profile.banned_at) reject('ACCOUNT_BANNED');
```

---

## 🧪 Test Cases

```ts
describe('anti-cheat', () => {
  it('rejects sub-minimum time', () => {
    const payload = makePayload({ time_seconds: 30, difficulty: 'expert' });
    expect(validate(payload)).rejects.toMatch('TOO_FAST');
  });

  it('rejects modified given', () => {
    const payload = makePayload({
      moves: [{ r: 0, c: 0, n: 9, t: 100 }],  // (0,0) was given
    });
    expect(validate(payload)).rejects.toMatch('MODIFIED_GIVEN');
  });

  it('rejects solution mismatch', () => {
    const payload = makePayload({ moves: invalidSolutionMoves });
    expect(validate(payload)).rejects.toMatch('SOLUTION_MISMATCH');
  });

  it('detects bot timing', () => {
    const moves = Array.from({ length: 50 }, (_, i) => ({
      r: i % 9, c: Math.floor(i / 9), n: 1, t: i * 500  // exact 500ms
    }));
    const payload = makePayload({ moves });
    expect(validate(payload)).rejects.toMatch('SUSPICIOUS_TIMING');
  });
});
```
