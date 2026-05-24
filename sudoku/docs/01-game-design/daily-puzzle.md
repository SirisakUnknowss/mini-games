# 📅 Daily Puzzle Spec

> ฟีเจอร์หลักของเกม — ทุกคนทั่วโลกได้ puzzle เดียวกันต่อวัน, reset เที่ยงคืน UTC

## 🎯 Goals

1. ทุกคนได้ puzzle เดียวกัน → leaderboard fair
2. ระดับยาก rotate ตามวันของสัปดาห์ (NYT-style) → varied experience
3. Puzzle ต้องมีเฉลยเดียวแน่นอน (unique solution) → fair
4. Generate ล่วงหน้า 30 วัน → ถ้า cron ล่ม ก็ยังเล่นได้

---

## 📋 Rules

### Reset Time
- **เที่ยงคืน UTC** ทุกวัน (= 7:00 AM Bangkok)
- เลือก UTC เพื่อ global consistency, ไม่เลือก local time เพราะ leaderboard ต้อง global

### Puzzle ID
```
daily_puzzle_id = YYYY-MM-DD (ISO date)
```
ตัวอย่าง: `2026-05-23`

### Difficulty Rotation
ตามวันในสัปดาห์ (เริ่มจาก Monday = 0):

| Day | Difficulty | Clues | Target Time |
|---|---|---|---|
| Monday | Easy | 45 | 3-5 นาที |
| Tuesday | Easy-Medium | 40 | 5-7 นาที |
| Wednesday | Medium | 35 | 7-10 นาที |
| Thursday | Medium-Hard | 32 | 10-15 นาที |
| Friday | Hard | 28 | 15-20 นาที |
| Saturday | Hard-Expert | 26 | 20-25 นาที |
| Sunday | Expert | 24 | 25-35 นาที |

**Reference:** NYT crossword ใช้ pattern นี้แล้ว retention สูง — คนรู้ว่า "วันศุกร์ยาก" จะ plan เวลาเล่น

---

## 🎲 Generation Algorithm

### Seed
```ts
seed = hash(YYYY-MM-DD)  // SHA-256 → integer
```
ใช้ date string เป็น seed → reproducible

### ขั้นตอน
```
1. seed = hashDate("2026-05-23")
2. solution = generateSolvedBoard(seed)
3. difficulty = getDifficultyForDay("2026-05-23")
4. puzzle = removeClues(solution, difficulty, seed)
5. assert hasUniqueSolution(puzzle)  // critical!
6. if not unique → re-generate with seed+1
7. store in DB
```

### Uniqueness Check (สำคัญมาก!)
v1 **ไม่ได้เช็ค** uniqueness → bug ที่ต้องแก้ใน production

Algorithm:
```ts
function hasUniqueSolution(puzzle): boolean {
  let solutionCount = 0;
  solve(puzzle, () => {
    solutionCount++;
    return solutionCount >= 2; // early exit
  });
  return solutionCount === 1;
}
```

**Implementation strategy:**
- ใช้ backtracking solver
- Count up to 2 solutions แล้วหยุด (เร็วกว่านับหมด)
- ถ้า > 1 → ลด clue ที่ลบล่าสุดออก → ลองช่องใหม่
- ถ้าวน 200 รอบยังไม่ unique → ใช้ seed+1

อ่านรายละเอียดที่ [`02-technical/puzzle-generator.md`](../02-technical/puzzle-generator.md)

---

## 🗄️ Storage Strategy

### Pre-generate 30 วันข้างหน้า
**ทำไม:** ถ้า cron ล่มวันใดวันนึง ก็ยังมี puzzle ให้เล่น

**Schedule:** Daily cron job ตอน 23:00 UTC
- เช็คว่ามี puzzle ครบ 30 วันข้างหน้าไหม
- ถ้าขาด → generate เพิ่ม

### Schema
```sql
CREATE TABLE daily_puzzles (
  date DATE PRIMARY KEY,           -- 2026-05-23
  difficulty TEXT NOT NULL,        -- easy/medium/hard/expert
  clues INTEGER NOT NULL,          -- 24-45
  puzzle TEXT NOT NULL,            -- 81 chars, '0' for empty
  solution TEXT NOT NULL,          -- 81 chars
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Format
```
puzzle  = "530070000600195000098000060800060003400803001700020006060000280000419005000080079"
solution = "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
```
- 81 chars
- `0` = empty
- `1-9` = number
- ส่ง ทั้ง 81-char string มา client (ไม่ใช่ array of arrays)

---

## 📊 Scoring (ใน Daily Mode)

แตกต่างจาก practice mode — สูตรเข้มงวดกว่าเพื่อ leaderboard fair

```ts
baseScore = {
  easy: 1000, easy-medium: 1500, medium: 2000,
  medium-hard: 2800, hard: 3500, hard-expert: 4200,
  expert: 5000
}[difficulty];

timePenalty = min(timeInSeconds * 2, baseScore * 0.4);  // cap 40%
mistakePenalty = mistakes * 100;                          // หนักกว่า practice
hintPenalty = hintsUsed * 300;                            // หนักกว่า practice
noMistakeBonus = mistakes === 0 ? 500 : 0;
noHintBonus = hintsUsed === 0 ? 300 : 0;

finalScore = max(100, baseScore - timePenalty - mistakePenalty - hintPenalty + noMistakeBonus + noHintBonus);
```

อ่าน detail ที่ [`leaderboard.md`](./leaderboard.md)

---

## 🚫 Edge Cases

### User เปลี่ยน timezone กลางคัน
- ใช้ UTC date เสมอ ไม่ใช้ local
- "วันนี้" ของผู้เล่นไทย = วันที่ใน Bangkok (UTC+7) แต่ puzzle เปลี่ยนเที่ยงคืน UTC
- **UI showing:** "Daily Puzzle of May 23, 2026" + countdown timer

### User เล่นข้ามเที่ยงคืน
- เริ่มเล่นวันก่อน, จบหลังเที่ยงคืน UTC → คะแนนนับเข้าวันที่ **เริ่มเล่น**
- เก็บ `started_at` timestamp ตอนคลิก start

### User เล่น Daily Puzzle หลายครั้ง
- เล่นได้ครั้งเดียว/วัน
- ถ้าออกกลางคัน → กลับมาเล่นต่อได้ (resume) จนถึงเที่ยงคืน UTC
- จบแล้วจะเข้าไปดูได้แต่ replay ไม่ได้

### ย้อนกลับไปเล่นวันเก่า (archive)
- **Free tier:** เล่นได้แค่ของวันนี้
- **Premium tier (future):** เข้า archive ย้อนหลังได้ 30 วัน
- ไม่ขึ้น leaderboard ของวันนั้น

### Puzzle generation ล่มหมด (worst case)
- มี fallback puzzle hardcoded 30 อัน ใน client
- โชว์ "Backup puzzle" badge
- คะแนนไม่ส่ง leaderboard

---

## 🎁 Rewards

### เล่นจบ Daily Puzzle
- **Coin:** 50 (easy) → 200 (expert)
- **XP:** 100 → 500
- **No-mistake bonus:** +30 coin, +100 XP
- **No-hint bonus:** +20 coin, +50 XP
- **Top 100 global:** +100 coin
- **Top 10 global:** +500 coin + special "Daily Champion" avatar item

### Streak bonus
- เล่นจบติด 7 วัน → 300 coin
- เล่นจบติด 30 วัน → 1500 coin + special title
- เล่นจบติด 100 วัน → 5000 coin + exclusive theme "Streak Master"

---

## 📤 Share Feature (Wordle-style)

หลังจบ daily puzzle ให้ share ได้:

```
🧩 Sudoku Daily #2026-05-23
⏱ 7:42 · ❌ 0 · 💡 0
🏆 Rank #142 / 8,432

Score: 4,300 / 5,000

Play: sudokudaily.app
```

**Implementation:**
- Copy to clipboard (default)
- Web Share API ถ้า supported
- Image card render (canvas) สำหรับ Instagram Story

---

## 🔍 Acceptance Criteria

- [ ] ทุกวันมี puzzle ใหม่ตอนเที่ยงคืน UTC
- [ ] Puzzle generation ล่วงหน้า 30 วันใน DB
- [ ] Unique solution guaranteed
- [ ] Difficulty match กับวันในสัปดาห์
- [ ] User เล่นได้ครั้งเดียว/วัน
- [ ] Resume ได้ถ้าออกกลางคัน
- [ ] Score ลง leaderboard อัตโนมัติ
- [ ] Share button ทำงาน
- [ ] Push notification ส่งตอนเที่ยงคืน local time
