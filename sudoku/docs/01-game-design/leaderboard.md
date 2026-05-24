# 🏆 Leaderboard Spec

> ระบบจัดอันดับผู้เล่น daily puzzle global

## 🎯 Goals

1. แข่งกับคนทั้งโลกในวันเดียวกัน → competition + retention
2. Reset ทุกวัน → ทุกคนมีโอกาสได้ที่ 1
3. แสดง history 7 วัน → user เห็น trajectory ของตัวเอง

---

## 📋 Rules

### Eligibility
- ต้องมี user account (anonymous user **ขึ้น leaderboard ได้** ในชื่อ "Anonymous #1234")
- ต้องเล่น **Daily Puzzle ของวันนั้น** ให้จบ
- ห้ามใช้ hint? **ใช้ได้** แต่โดน penalty หนัก
- ห้ามผิด? **ผิดได้** แต่โดน penalty

### Reset Time
- **เที่ยงคืน UTC** ทุกวัน
- เก็บ history 7 วันย้อนหลัง
- All-time leaderboard ไม่มี (ป้องกัน first-mover advantage มากเกิน)

### Tiebreaker (เรียงตามลำดับ)
1. Score (สูงกว่า = ดีกว่า)
2. Time (เร็วกว่า = ดีกว่า)
3. Mistakes (น้อยกว่า = ดีกว่า)
4. Submission time (เร็วกว่า = ดีกว่า)

---

## 🧮 Score Formula

```ts
function computeDailyScore({
  difficulty: Difficulty,
  timeInSeconds: number,
  mistakes: number,
  hintsUsed: number,
}): number {
  const BASE_SCORES = {
    easy: 1000,
    'easy-medium': 1500,
    medium: 2000,
    'medium-hard': 2800,
    hard: 3500,
    'hard-expert': 4200,
    expert: 5000,
  };

  const base = BASE_SCORES[difficulty];

  const timePenalty = Math.min(timeInSeconds * 2, base * 0.4);
  const mistakePenalty = mistakes * 100;
  const hintPenalty = hintsUsed * 300;

  const noMistakeBonus = mistakes === 0 ? 500 : 0;
  const noHintBonus = hintsUsed === 0 ? 300 : 0;

  return Math.max(
    100,
    Math.round(
      base - timePenalty - mistakePenalty - hintPenalty
        + noMistakeBonus + noHintBonus
    )
  );
}
```

### ตัวอย่าง
| Scenario | Difficulty | Time | Mistakes | Hints | Score |
|---|---|---|---|---|---|
| Perfect speedrun | Expert | 5:00 | 0 | 0 | **5000 − 600 + 800 = 5200** |
| Solid | Hard | 12:00 | 1 | 0 | 3500 − 1400 − 100 + 300 = **2300** |
| Sloppy | Medium | 15:00 | 5 | 2 | 2000 − 800 − 500 − 600 = **100** (floor) |
| Casual | Easy | 8:00 | 2 | 1 | 1000 − 400 − 200 − 300 = **100** (floor) |
| Easy perfect | Easy | 3:00 | 0 | 0 | 1000 − 360 + 800 = **1440** |

---

## 🗄️ Storage

```sql
CREATE TABLE daily_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  mistakes INTEGER NOT NULL,
  hints_used INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (date, user_id)  -- เล่นได้ครั้งเดียว/วัน
);

CREATE INDEX idx_leaderboard_date_score
  ON daily_leaderboard (date, score DESC, time_seconds ASC);
```

---

## 🛡️ Anti-cheat (สำคัญ!)

v1 มี bug: ผู้ใช้แก้ localStorage โกงคะแนนได้ → production ต้องป้องกัน

### Server-side validation
ทุก submission ต้อง POST ผ่าน Edge Function:

```ts
// supabase/functions/submit-daily-score.ts

async function submitDailyScore(req) {
  const { date, time, mistakes, hints, moves } = req.body;
  const userId = req.user.id;

  // 1. ดึง puzzle ของวันนั้น
  const puzzle = await getDailyPuzzle(date);

  // 2. Sanity check
  if (time < MIN_REASONABLE_TIME[puzzle.difficulty]) reject('too_fast');
  if (time > MAX_REASONABLE_TIME) reject('too_slow');
  if (mistakes < 0 || mistakes > 200) reject('invalid_mistakes');
  if (hints < 0 || hints > 3) reject('invalid_hints');

  // 3. Verify moves replay → final state = solution
  //    (ส่ง moves[] = [{r,c,n,t}, ...] เพื่อ replay)
  const finalBoard = replayMoves(puzzle.puzzle, moves);
  if (!matchesSolution(finalBoard, puzzle.solution)) reject('invalid_solution');

  // 4. Compute score server-side (ห้ามเชื่อ client)
  const score = computeDailyScore({ difficulty: puzzle.difficulty, time, mistakes, hints });

  // 5. Check uniqueness
  const exists = await db.from('daily_leaderboard').select().eq('date', date).eq('user_id', userId);
  if (exists) reject('already_submitted');

  // 6. Insert
  await db.from('daily_leaderboard').insert({ date, user_id: userId, score, ... });
  return { score, rank: await getRank(date, score) };
}
```

### MIN_REASONABLE_TIME (sec)
| Difficulty | Min |
|---|---|
| easy | 60 |
| easy-medium | 90 |
| medium | 120 |
| medium-hard | 150 |
| hard | 180 |
| hard-expert | 210 |
| expert | 240 |

ใครจบ Expert ใต้ 4 นาที = bot/cheat แน่นอน (record world ~5 นาที)

### Move Recording
Client ต้องส่ง move log:
```ts
type Move = {
  r: 0-8;
  c: 0-8;
  n: 0-9;  // 0 = erase
  t: number;  // ms since game start
};
```
Server replay → ตรวจว่าจบจริง + time consistent กับ moves

---

## 🎨 UI

### Daily Leaderboard Screen

```
┌────────────────────────────────────┐
│ ← Daily Leaderboard                │
│   May 23, 2026 · Hard              │
│   ⏱ Next: 14h 32m                  │
├────────────────────────────────────┤
│ 🥇 SudokuMaster      4,820  5:42  │
│ 🥈 user_jp_42        4,780  5:51  │
│ 🥉 NinjaSolver       4,650  6:12  │
│  4. cool_player_99   4,600  6:18  │
│  5. ...                            │
│ ...                                │
│ 142. YOU 👤          3,400  9:18  │
│ ...                                │
├────────────────────────────────────┤
│ [ Today ] [ Yesterday ] [ Week ]  │
└────────────────────────────────────┘
```

### Components
- **Top 100** scrollable
- **"YOU" sticky** — ตำแหน่งของเรา highlight + sticky scroll
- **Tabs** — Today / Yesterday / Last 7 days summary
- **Filters** — Global / Friends only (future)
- **Avatar** + display name + country flag

---

## 🚀 Realtime Updates

ใช้ Supabase Realtime:
```ts
supabase
  .channel('daily-leaderboard')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'daily_leaderboard',
    filter: `date=eq.${today}`
  }, (payload) => updateLeaderboard(payload.new))
  .subscribe();
```

แต่ load full → poll ทุก 30 วินาที (Realtime expensive ถ้าคนเยอะ)

---

## 📊 Pagination

- Server-side pagination 50 rows/page
- Infinite scroll ใน UI
- "Jump to my rank" button

---

## 🚫 Edge Cases

### User submit score ก่อนเที่ยงคืน UTC พอดี
- Score เข้า leaderboard ของ "yesterday's date"
- ยึด `started_at` ของเกม → ตัดสินว่าวันไหน

### Network fail ตอน submit
- Save ใน local queue → retry exponential backoff
- Show "Score will be submitted when online"

### Duplicate submission (race condition)
- DB unique constraint `(date, user_id)` กัน
- Show error "Already submitted"

### User เปลี่ยน display name หลังขึ้น leaderboard
- โชว์ name ปัจจุบัน (denormalize ผ่าน FK + join ทุกครั้ง)

---

## 🔍 Acceptance Criteria

- [ ] Submission ต้อง server-validate
- [ ] Realtime updates ใน leaderboard
- [ ] Tiebreaker ทำงานถูกต้อง
- [ ] Pagination 50/page
- [ ] My rank sticky
- [ ] History 7 วัน
- [ ] Anti-cheat: replay moves → match solution
