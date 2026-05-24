# 📈 Progression System

> XP, Level, Streak — ระบบ long-term progression

## 🎯 Goals

1. ให้ผู้เล่นรู้สึก "เก่งขึ้น/พัฒนา" แม้ skill เกมไม่ขึ้น
2. Drip-feed unlock — ปลดล็อก item/feature ทีละขั้น
3. Streak = retention hook

---

## ⭐ XP & Level

### XP Sources
| Action | XP |
|---|---|
| ชนะ Easy game | 50 |
| ชนะ Medium game | 100 |
| ชนะ Hard game | 200 |
| ชนะ Expert game | 350 |
| ชนะ Daily Puzzle | 100-500 (ตาม difficulty) |
| No-mistake bonus | +50% |
| No-hint bonus | +30% |
| Quest complete | 30-200 |
| Daily quest all 3 | +200 |
| Achievement | 50-2000 (ตาม tier) |
| First time playing | 100 |

### Level Curve
```
XP required for level N = floor(100 * N^1.6)
```

| Level | XP needed (cumulative) | Time estimate (casual) |
|---|---|---|
| 1 → 2 | 100 | day 1 |
| 1 → 5 | ~1,200 | week 1 |
| 1 → 10 | ~5,000 | week 3 |
| 1 → 20 | ~25,000 | month 2 |
| 1 → 50 | ~250,000 | month 6-8 |
| 1 → 100 | ~1,800,000 | year 1-2 |

**Cap:** Level 100, จาก level 100 → "Prestige" (reset level, keep cosmetic)

### Level-up Rewards
- Level 1-10: 50c + 1 item แต่ละ level
- Level 11-30: 100c + theme unlock
- Level 31-50: 250c + avatar slot unlock
- Level 51-100: 500c + exclusive cosmetic
- Level 100: legendary frame

---

## 🔥 Streak

### Definition
- เล่น **Daily Puzzle ให้จบ** ในวันนั้น = นับ streak
- ไม่นับ practice mode
- Reset ถ้าพลาด 1 วัน

### Display
```
🔥 7 days
```

### Rewards
| Streak | Reward |
|---|---|
| 3 | 30c |
| 7 | 100c + animation |
| 14 | 250c |
| 30 | 800c + title "Monthly" |
| 50 | 1500c |
| 100 | 5000c + exclusive theme |
| 200 | 10000c |
| 365 | 30000c + title "Eternal" + legendary item |

### Streak Freeze (Item)
- **ราคา:** 200 coin / ชิ้น
- **Limit:** ถือได้สูงสุด 3 ชิ้น
- **Effect:** ป้องกัน streak หลุด 1 วันถ้าพลาด
- **Auto-use:** ใช้อัตโนมัติเมื่อตื่นมาเช้าวันถัดไปแล้วเห็นว่าพลาด
- **UI:** "🛡️ Streak Freeze ถูกใช้! Streak ของคุณยังอยู่"

### Streak Insurance (Free, ทุก 30 วัน)
- ทุก 30 วัน user ได้ "free freeze" 1 ชิ้น
- โผล่ในกระเป๋าอัตโนมัติ
- ป้องกัน streak ที่ยาวมากๆ หลุดเพราะ "ลืม"

---

## 🎯 Onboarding (First 7 Days)

### Day 1
- เล่น tutorial → +100 XP
- เล่น easy 1 ด่าน → +50 XP
- ปลดล็อก achievement "First Win"

### Day 2-3
- Push notif: "เล่น Daily วันนี้!"
- ทำ daily quest → +100 XP
- ปลดล็อก streak 3 → +30c

### Day 4-7
- ปลดล็อก streak 7 → 100c + special badge
- เปิด shop tour
- แนะนำ theme/avatar
- ปลดล็อก "Week Warrior" achievement

**เป้า:** ให้ user ติด streak ก่อนเลิกใช้

---

## 🗄️ Storage

```sql
CREATE TABLE user_progression (
  user_id UUID PRIMARY KEY,
  xp BIGINT NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  prestige INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_daily_played DATE,
  streak_freezes INTEGER NOT NULL DEFAULT 1,  -- เริ่มมี 1
  next_free_freeze_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 🚫 Edge Cases

### User เล่นข้ามวัน
- Streak นับตาม **UTC date ของ daily puzzle**
- ถ้า user ใน timezone UTC+12 เริ่มเล่นวันนี้แต่จบเป็น "พรุ่งนี้" → ยังนับวันที่เริ่ม

### Streak reset
- เช้าวันใหม่ตอน 00:01 UTC: cron check streak
- ถ้าวันก่อนไม่เล่นแล้วไม่มี freeze → reset เป็น 0
- มี freeze → consume 1 freeze, streak ยังอยู่

### Prestige
- เลือกได้เอง (optional) — UI: "Prestige: รีเซ็ต level เป็น 1 แต่ได้ frame พิเศษ"
- เก็บ items/coins/achievements ไว้หมด
- ทำได้ไม่จำกัด

---

## 🔍 Acceptance Criteria

- [ ] XP gain ทุก action ตามตาราง
- [ ] Level up animation + reward
- [ ] Streak นับถูกต้อง + reset ถูกเวลา
- [ ] Streak freeze auto-use
- [ ] Free freeze ทุก 30 วัน
- [ ] Onboarding sequence first 7 days
