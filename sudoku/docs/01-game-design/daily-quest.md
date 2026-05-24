# 🎯 Daily Quest Spec

> 3 quest/วัน สุ่มจาก pool — ทำให้คนเล่นมากกว่าแค่ daily puzzle

## 🎯 Goals

1. ให้เหตุผลผู้เล่นเล่นเกินกว่า daily puzzle (เพิ่ม session length)
2. Variable reward — แต่ละวันได้ quest ไม่เหมือนกัน
3. Drive แต่ละ game mode (daily, practice, easy, hard...)

---

## 📋 Quest Rules

### จำนวน
- **3 quest/วัน** เท่านั้น
- Reset เที่ยงคืน UTC (เหมือน daily puzzle)
- ทำได้ครบ 3 → ได้ **completion bonus**

### Selection
- สุ่มจาก pool โดยใช้ seed = date + user_id
- → ผู้ใช้แต่ละคนได้ quest **ต่างกัน** แต่ละคนได้ของตัวเองเท่ากันทุกครั้งที่ refresh
- กฎ:
  - Quest 1 = "easy" tier (ทำได้แน่ๆ จากการเล่น daily)
  - Quest 2 = "medium" tier
  - Quest 3 = "hard" tier (ต้อง effort)

### Progress Tracking
- บันทึก progress real-time
- เห็น "2/5 เกม" ใน UI
- ทำเสร็จ → animation + claim reward button

---

## 📚 Quest Pool

### Tier 1: Easy (ผู้เล่นทำได้จาก daily อย่างเดียว)

| ID | คำอธิบาย | Target | Reward |
|---|---|---|---|
| Q_DAILY | เล่น Daily Puzzle วันนี้ให้จบ | 1 | 50 coin |
| Q_PLAY_ANY | เล่นเกมใดก็ได้ให้จบ | 1 | 30 coin |
| Q_LOGIN | เปิดแอป | 1 | 20 coin |

### Tier 2: Medium (ต้องเล่นเพิ่ม 2-3 เกม)

| ID | คำอธิบาย | Target | Reward |
|---|---|---|---|
| Q_PLAY_3 | เล่น 3 เกมให้จบ | 3 | 80 coin |
| Q_EASY_2 | เล่น Easy 2 เกม | 2 | 60 coin |
| Q_MEDIUM_1 | เล่น Medium 1 เกม | 1 | 70 coin |
| Q_NO_HINT_1 | ชนะ 1 เกมโดยไม่ใช้ hint | 1 | 100 coin |
| Q_FAST_1 | ชนะ easy ภายใน 5 นาที | 1 | 80 coin |
| Q_NUMPAD_USE | ใส่เลข 100 ครั้ง | 100 | 60 coin |
| Q_CORRECT_50 | ใส่เลขถูก 50 ครั้ง | 50 | 80 coin |

### Tier 3: Hard (ต้อง effort เยอะ)

| ID | คำอธิบาย | Target | Reward |
|---|---|---|---|
| Q_PERFECT | ชนะเกมโดยไม่ผิดเลย | 1 | 150 coin |
| Q_HARD_1 | ชนะ Hard 1 เกม | 1 | 180 coin |
| Q_EXPERT_1 | ชนะ Expert 1 เกม | 1 | 250 coin |
| Q_FAST_MEDIUM | ชนะ Medium ภายใน 8 นาที | 1 | 200 coin |
| Q_TOP_500 | Daily leaderboard top 500 | 1 | 200 coin |
| Q_TOP_100 | Daily leaderboard top 100 | 1 | 400 coin |
| Q_NO_MISTAKE_HARD | ชนะ Hard โดยไม่ผิด | 1 | 300 coin |
| Q_PLAY_5 | เล่น 5 เกมในวันเดียว | 5 | 200 coin |
| Q_STREAK_KEEP | รักษา streak (เล่น daily) | 1 | 150 coin |

### Tier 4: Special (limited, weekend/event)

| ID | คำอธิบาย | Target | Reward |
|---|---|---|---|
| Q_WEEKEND_HARD | (เสาร์-อาทิตย์) ชนะ Hard 3 เกม | 3 | 500 coin |
| Q_TEAM_TIME | ทีมเล่นรวมเวลา 60 นาที | - | (future) |

---

## 🎁 Reward Structure

### Quest individual reward
ดูในตาราง pool — แต่ละ quest มี coin reward เฉพาะ

### Daily completion bonus (ทำครบ 3)
- **100 coin** + **200 XP**
- Animation ใหญ่ + ปลดล็อก loot box (random skin/item)

### Weekly bonus (ทำครบ 7 วันติด)
- **500 coin** + **special title**

---

## 🎲 Quest Generation Algorithm

```ts
function generateDailyQuests(userId: string, date: string): Quest[] {
  const seed = hash(userId + date);
  const rng = seededRng(seed);

  const tier1 = pickRandom(TIER_1_POOL, rng);
  const tier2 = pickRandom(TIER_2_POOL, rng);
  const tier3 = pickRandom(TIER_3_POOL, rng);

  // Avoid duplicates with yesterday
  const yesterday = getYesterdayQuests(userId);
  if (overlap(tier2, yesterday)) tier2 = pickRandom(TIER_2_POOL, rng);
  if (overlap(tier3, yesterday)) tier3 = pickRandom(TIER_3_POOL, rng);

  return [tier1, tier2, tier3];
}
```

**Note:** Quest แต่ละ user ไม่เหมือนกัน — ลด feeling "เหมือนเดิมทุกวัน"

---

## 🗄️ Storage

### Tables (ดู `02-technical/database-schema.md`)

```sql
CREATE TABLE user_daily_quests (
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  quest_id TEXT NOT NULL,        -- 'Q_PLAY_3'
  target INTEGER NOT NULL,        -- 3
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, date, quest_id)
);

CREATE TABLE user_quest_bonus (
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  bonus_claimed BOOLEAN DEFAULT false,
  PRIMARY KEY (user_id, date)
);
```

---

## 🎨 UI

### Daily Quest Card (บนหน้า home)
```
┌─────────────────────────────────────┐
│ 🎯 Daily Quests                  3/3│
│                                     │
│ ✅ เล่น Daily Puzzle          50🪙   │
│ 🔵 เล่น 3 เกม (2/3)          80🪙   │
│ ⚪ ชนะ Hard 1 เกม (0/1)     180🪙   │
│                                     │
│ ⭐ Bonus: ครบ 3 quest        100🪙   │
│ [ ดูทั้งหมด ]                       │
└─────────────────────────────────────┘
```

### States
- ⚪ Not started (gray)
- 🔵 In progress (blue, with progress bar)
- ✅ Completed (green, with "claim" button)
- 🎁 Claimed (faded, with "claimed" badge)

---

## 🚫 Edge Cases

### Quest progress ตอน offline
- เก็บใน local queue, sync เมื่อ online
- Server เป็น source of truth (anti-cheat)

### User ทำ quest แล้ว app crash ก่อน claim
- Progress = saved on game complete (transaction)
- Claim = แยกออกมา — กลับมาเปิดยังเห็น "claim" button

### Reset เกิดตอนกำลังเล่น
- Game ที่กำลังเล่น → จบแล้วนับเข้าวัน "เริ่มเล่น"
- ดู `daily-puzzle.md` Edge Cases

### User เล่นข้าม timezone (เดินทาง)
- UTC อย่างเดียว — UI โชว์ countdown clear

---

## 🔍 Acceptance Criteria

- [ ] ทุกวัน user ได้ 3 quest ใหม่
- [ ] Quest tier 1/2/3 ครบ 1 ต่อ tier
- [ ] Progress update real-time ระหว่างเล่น
- [ ] Claim reward → coin ลงกระเป๋าทันที
- [ ] Completion bonus ทำงาน
- [ ] Quest persist ข้าม session
- [ ] ไม่มี duplicate quest กับวันก่อน (tier 2-3)
