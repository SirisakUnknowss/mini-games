# 🪙 Coin Economy

> Source of truth ของตัวเลข coin ทั้งหมดในเกม — ห้าม hardcode ที่อื่น

## 🎯 Design Principles

1. **Inflow > Outflow ในช่วงแรก** — ผู้เล่นต้องรู้สึก "มีเงินซื้อของ"
2. **Cheap items ทุกวัน** — มีของถูกให้ซื้อได้ทุกวัน → dopamine hit
3. **Expensive aspirational** — มีของแพง 5,000-10,000c เป็นเป้าหมายเดือน
4. **No real money ใน MVP** — coin หาเองอย่างเดียว

---

## 💰 Inflow (วิธีได้เหรียญ)

### Per-game Rewards
| Action | Coin |
|---|---|
| ชนะ Easy (practice) | 5 |
| ชนะ Medium (practice) | 10 |
| ชนะ Hard (practice) | 20 |
| ชนะ Expert (practice) | 35 |
| ชนะ Daily Puzzle | 50-200 (ตาม difficulty) |
| No-mistake bonus | +30% |
| No-hint bonus | +20% |

### Daily/Weekly Bonuses
| Event | Coin |
|---|---|
| Daily login bonus | 10 |
| Login 7 วันติด | 100 (bonus) |
| Daily quest individual | 20-400 (ดู [daily-quest.md](./daily-quest.md)) |
| Daily quest complete all 3 | 100 |
| Weekly bonus (7 วันครบ quest) | 500 |

### Leaderboard
| Achievement | Coin |
|---|---|
| Daily top 1000 | 50 |
| Daily top 500 | 100 |
| Daily top 100 | 200 |
| Daily top 10 | 500 |
| Daily #1 | 2000 |

### Streak
| Milestone | Coin |
|---|---|
| Streak 3 | 30 |
| Streak 7 | 100 |
| Streak 14 | 250 |
| Streak 30 | 800 |
| Streak 100 | 5000 |
| Streak 365 | 30000 |

### Achievement (One-time)
ดู [achievements.md](./achievements.md) — รวม coin ที่ได้ทั้งหมด ~50,000c (ถ้าปลดล็อกครบ)

### Level-up
| Level Range | Coin per level |
|---|---|
| 2-10 | 50 |
| 11-30 | 100 |
| 31-50 | 250 |
| 51-100 | 500 |

---

## 📊 Average Inflow ต่อวัน (Casual Player)

**Scenario:** เล่น daily + 2 practice games + ทำ quest 2/3

```
Daily Puzzle (medium win):       100c
Daily login:                      10c
Quest 1 (easy):                   50c
Quest 2 (medium):                 80c
Practice × 2 (medium):            20c
Streak day bonus:                  0c (ไม่ถึง milestone)
─────────────────────────────────────
Total daily:                    ~260c
Monthly:                       ~7,800c
```

**Hardcore player:** ทำครบทุก quest + leaderboard top 500 + perfect → ~600c/วัน → 18,000c/เดือน

---

## 💸 Outflow (วิธีใช้เหรียญ)

### Shop Items

#### Themes (10 base)
| Theme | Price |
|---|---|
| Classic | Free |
| Dark | 200c |
| Pastel | 200c |
| Ocean | 300c |
| Forest | 300c |
| Sunset | 400c |
| Neon | 500c |
| Sakura | 600c |
| Thai Heritage | 800c |
| Mono Pro | 1000c |

#### Backgrounds (10 base)
| Background | Price |
|---|---|
| Default Gradient | Free |
| Solid (5 colors) | 100c |
| Pattern (5 types) | 200c |
| Photo (5 photos) | 400c |
| Animated (3) | 1000c |

#### Avatar Items (categorical)
| Category | Common | Rare | Epic |
|---|---|---|---|
| Face/Skin | 50c | 200c | 500c |
| Hat | 100c | 300c | 800c |
| Eyes | 100c | 300c | 800c |
| Body | 150c | 400c | 1000c |
| Pet | 300c | 800c | 2000c |
| Frame (รอบ avatar) | 200c | 600c | 1500c |

#### Consumables
| Item | Price | Effect |
|---|---|---|
| Streak Freeze | 200c | กัน streak 1 วัน |
| Extra Hint Pack (3) | 100c | เพิ่ม hint 3 ครั้งในเกมถัดไป |
| Coin Boost 2× (1 day) | 500c | inflow ×2 ใน 24 ชม |

#### Special Bundle (rotating)
| Bundle | Price | Contents |
|---|---|---|
| Starter Pack | 500c | 3 themes + 5 avatar items |
| Premium Set | 2000c | Epic avatar + matching theme + frame |
| Mystery Box | 300c | สุ่ม item |

---

## 🎁 Free Items (Onboarding)

ผู้เล่นใหม่ได้ฟรี:
- 1 theme (Classic)
- 1 background (Default)
- 1 avatar base + 3 items random
- 100c starter coin
- 1 streak freeze

---

## 📈 Economy Balance Targets

### Spent Rate
> 70% ของ coin ที่ได้ถูกใช้ภายใน 7 วัน

ถ้าต่ำกว่า → ของขายน่าซื้อไม่พอ
ถ้าสูงเกิน (>90%) → ของแพงไม่พอ aspirational

### Coin Hoarding
- ผู้เล่นทั่วไปไม่ควรมี > 3,000c ค้างนานๆ
- ถ้ามี → trigger event "Big Sale"

### Inflation Control
- ห้าม buff coin reward เพิ่ม
- ถ้าจะให้เยอะขึ้น → ทำเป็น event ระยะสั้น

---

## 🎯 LTV Calculation (Future Monetization)

ถ้าเปิด IAP ภายหลัง:
| Coin Pack | Price (USD) | Coin |
|---|---|---|
| Small | $0.99 | 1,000c |
| Medium | $4.99 | 6,000c |
| Large | $9.99 | 14,000c |
| Mega | $49.99 | 90,000c |

**Note:** อย่าเปิด IAP ก่อน DAU 5k

---

## 🗄️ Storage

```sql
CREATE TABLE user_wallet (
  user_id UUID PRIMARY KEY,
  coins INTEGER NOT NULL DEFAULT 100,  -- starter
  total_earned BIGINT NOT NULL DEFAULT 100,
  total_spent BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coin_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,  -- + for earn, - for spend
  reason TEXT NOT NULL,      -- 'daily_quest', 'shop_purchase', etc.
  metadata JSONB,            -- { itemId, questId, ... }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coin_tx_user_time ON coin_transactions (user_id, created_at DESC);
```

**Audit trail:** ทุก coin change ต้องมี transaction log

---

## 🛡️ Anti-cheat

ห้าม client บวกเงินเอง — ทุก inflow ผ่าน Edge Function:

```ts
// supabase/functions/grant-coins.ts
async function grantCoins(userId, amount, reason, metadata) {
  // 1. Validate event (quest verify, game verify, etc.)
  if (!await isValidEvent(userId, reason, metadata)) reject();

  // 2. Atomic update
  await db.transaction(async tx => {
    await tx.update('user_wallet').increment('coins', amount).eq('user_id', userId);
    await tx.insert('coin_transactions', { user_id: userId, amount, reason, metadata });
  });
}
```

---

## 🔍 Acceptance Criteria

- [ ] ทุก coin change มี transaction log
- [ ] Coin reward ตรงตามตาราง
- [ ] Shop price ตรงตามตาราง
- [ ] Wallet update atomic
- [ ] Server-side validation
- [ ] UI โชว์ coin balance อัปเดตทันที
