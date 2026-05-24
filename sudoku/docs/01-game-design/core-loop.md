# 🔄 Core Gameplay Loop

## Loop หลัก (Daily Engagement)

```
                ┌────────────────────────────┐
                │  เปิด app (เช้า/ก่อนนอน)    │
                └────────────┬───────────────┘
                             ▼
            ┌─────────────────────────────────┐
            │  เห็น "Daily Puzzle ใหม่ + 3 Quest"│
            │  Streak counter: "วันที่ N"      │
            └────────────┬────────────────────┘
                         ▼
            ┌─────────────────────────────────┐
            │  เล่น Daily Puzzle (5-15 นาที)   │
            └────────────┬────────────────────┘
                         ▼
            ┌─────────────────────────────────┐
            │  จบ → คะแนน + อันดับ leaderboard  │
            │  + Coin reward + XP             │
            └────────────┬────────────────────┘
                         ▼
            ┌─────────────────────────────────┐
            │  Quest progress อัปเดต           │
            │  ทำ quest อื่นต่อ → เล่น practice │
            └────────────┬────────────────────┘
                         ▼
            ┌─────────────────────────────────┐
            │  ดู shop → ซื้อของ → แต่ง avatar  │
            └────────────┬────────────────────┘
                         ▼
            ┌─────────────────────────────────┐
            │  Share leaderboard result        │
            │  ปิด app                         │
            └────────────┬────────────────────┘
                         ▼
            ┌─────────────────────────────────┐
            │  เที่ยงคืน: Push notif            │
            │  "Daily puzzle ใหม่พร้อมแล้ว!"    │
            │  "อย่าทำ streak หลุดนะ"          │
            └────────────┬────────────────────┘
                         └──→ กลับไปต้น loop
```

---

## 🎯 ทำไม loop นี้ทำงาน

### 1. FOMO Mechanic
- Daily puzzle **มีแค่วันละ 1 อัน** — พลาดวันนี้ = พลาดไปเลย
- Leaderboard reset ทุกวัน — มีโอกาส top 1 ทุกวัน
- Streak — เล่นทุกวันได้ bonus, หลุด 1 วันเริ่มใหม่

### 2. Variable Reward
- ระดับยาก puzzle แต่ละวันต่างกัน (จันทร์ง่าย, อาทิตย์ยากสุด)
- อันดับ leaderboard ไม่แน่นอน
- Quest 3 อันสุ่มทุกวัน

### 3. Progression
- Coin สะสม → ซื้อของ → แต่งตัว → โชว์ใน leaderboard
- XP → level up → unlock item ใหม่
- Achievement long-term

### 4. Social Proof
- Leaderboard global
- Avatar โชว์ใน leaderboard
- Share result ออกไปนอกแอป

---

## 🔁 Sub-loops

### A. Single Game Loop (ระหว่างเล่น 1 puzzle)
```
เห็นกระดาน → คลิกช่อง → เลือกเลข → 
ถูก: ความรู้สึกดี / ผิด: animation เตือน
→ ใกล้จบ: highlight ช่องที่เหลือ → ชนะ → animation
```

### B. Practice Loop (เล่นด่านปกติ)
```
เลือก level → เลือกด่าน 1-100 → เล่น → จบ → ได้ XP + coin
→ ปลดล็อกด่านถัดไป
```
**Note:** Practice mode ไม่นับ leaderboard, ไม่ใช้ daily seed

### C. Quest Loop
```
ดู quest 3 อัน → เล่นให้ตรง condition → quest ✓ → 
รับ reward → ทำต่อจนครบ 3 → daily quest complete bonus
```

### D. Shop Loop
```
สะสม coin → เปิด shop → preview → ซื้อ → equip → 
เปลี่ยน look ใน game → กลับมาเล่นต่อ
```

---

## ⏱️ Time Budget ของผู้เล่นทั่วไป

| Action | เวลา |
|---|---|
| เปิดแอป + ดูหน้าหลัก | 30 วินาที |
| เล่น daily puzzle (medium) | 5-10 นาที |
| ดู leaderboard + share | 1-2 นาที |
| ทำ quest อื่น (1 practice game) | 5-8 นาที |
| Shop browse + ซื้อ | 2-3 นาที |
| **Total session เฉลี่ย** | **10-20 นาที** |

**เป้าหมาย:** Average session length 8-15 นาที × 1.2 sessions/วัน = 12-18 นาที/วัน/user

---

## 🚫 Anti-patterns ที่ห้ามทำ

1. **ห้ามขัด flow ด้วย ads ใน MVP** — interstitial = death
2. **ห้ามใส่ paywall** ใน core loop
3. **ห้าม force login ก่อนเล่น** — let user เล่นในฐานะ anonymous ก่อน
4. **ห้ามมี energy/lives system** — Sudoku ไม่ใช่ Candy Crush, ห้ามจำกัดการเล่น
5. **ห้าม punish การเลิกเล่นแรง** — streak หลุดได้ ห้ามลบ progress
