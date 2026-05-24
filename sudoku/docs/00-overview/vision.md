# 🎯 Product Vision

## One-liner
**Sudoku Daily** — เกม Sudoku ที่คนเปิดเล่นทุกวันเพื่อทำ daily puzzle, ไต่ leaderboard, สะสมเหรียญแต่งตัวละคร

## Positioning Statement
> สำหรับ **คนที่ชอบ puzzle/casual game บนมือถือ** ที่อยากมี **เกมเล่นวันละ 5-15 นาทีก่อนนอน/ระหว่างพัก**, **Sudoku Daily** เป็น Sudoku game ที่ **มี daily puzzle ระดับโลก, leaderboard แข่งจริง, และระบบ customization** — ต่างจาก **Sudoku.com** ที่เน้นเล่นคนเดียวและมีโฆษณารบกวน, ของเรา **focus ที่ engagement ผ่าน social mechanic และ progression**

---

## 🎯 Target Users

### Primary: "Casual Daily Player"
- **อายุ** 25-45
- **พฤติกรรม** เล่นเกมมือถือ 10-30 นาที/วัน ก่อนนอน, ระหว่างพัก, ระหว่างเดินทาง
- **คู่เทียบเกมที่เล่น** Wordle, NYT Games, Candy Crush, Sudoku.com
- **Pain point** เกม Sudoku ที่มีตอนนี้ "เหงา" — ไม่มี social, ไม่มีเป้าหมายระยะยาว, ads เยอะ
- **Why they'd come** Daily puzzle + leaderboard ทำให้รู้สึก "พลาดวันนี้ = พลาดไปเลย"

### Secondary: "Achievement Hunter"
- **อายุ** 18-30
- **พฤติกรรม** ชอบเก็บ achievement, customize, แข่ง stats
- **Why they'd stay** Achievement 50+ อัน + avatar/theme หลายแบบ

---

## 🚫 Non-goals (สิ่งที่จะ "ไม่ทำ" ใน MVP)

- ❌ Monetization (ads/IAP) — ทำหลังมี DAU พอ
- ❌ Multiplayer realtime — leaderboard ก็พอ
- ❌ Sudoku variant (Killer, Samurai) — focus classic 9×9 ก่อน
- ❌ Story mode / RPG layer — ทำใน v2+
- ❌ Native app เขียนใหม่ — ใช้ PWA + Capacitor wrap

---

## 📊 Success Metrics

### North Star Metric
**D7 Retention** = % ของ user ที่ install แล้วยังเล่นในวันที่ 7

| Phase | Target D1 | Target D7 | Target D30 | DAU Target |
|---|---|---|---|---|
| MVP launch (3 เดือน) | 35% | 15% | 5% | 500 |
| Phase 2 (6 เดือน) | 45% | 25% | 10% | 5,000 |
| Phase 3 (12 เดือน) | 50% | 30% | 15% | 50,000 |

**Benchmark อุตสาหกรรม:**
- Casual puzzle เฉลี่ย D7 = 18-22%
- Sudoku.com เคยรายงาน D7 ~30% (ปี 2022)

### Secondary metrics
- **Daily Puzzle completion rate** > 60% ของ DAU
- **Average session length** 8-15 นาที
- **Streak ≥ 7 วัน** > 20% ของ MAU
- **Coin spent rate** > 70% (เหรียญที่ได้ ถูกใช้)

---

## 🏆 Competitive Positioning

| Feature | Sudoku.com | Brainium | NYT Sudoku | **เรา** |
|---|---|---|---|---|
| Daily puzzle | ✅ มี | ❌ | ✅ มี | ✅ + viral share |
| Global leaderboard | ❌ | ❌ | ✅ Limited | ✅ Daily reset |
| Avatar/customize | ❌ | ❌ | ❌ | ✅ |
| Themes | Basic | Basic | Basic | ✅ 10+ |
| Daily quest | ❌ | ❌ | ❌ | ✅ |
| Streak | ✅ | ❌ | ✅ | ✅ + freeze |
| Achievement | Basic | ✅ | ❌ | ✅ 50+ |
| Ads | 🔴 Heavy | Medium | ✅ Paywall | ❌ (MVP) |
| Price | Free + IAP | Paid $5 | Subscription | Free |

**ช่องว่างที่เราโจมตี:**
1. ไม่มีคู่แข่งที่รวม "daily + leaderboard + customization" ในที่เดียว
2. Sudoku ส่วนใหญ่ "ไม่มี personality" — เป็น tool ไม่ใช่ game
3. Ads heavy ของ Sudoku.com ทำให้ user เกลียด แต่ก็ไม่มีทางเลือกฟรีที่ดีกว่า

---

## 🌍 Launch Strategy

### Geo
- **Soft launch:** ไทย (เดือน 1-2) — เก็บ feedback, ปรับ balance
- **SEA expansion:** ฟิลิปปินส์, อินโดฯ, เวียดนาม (เดือน 3-4)
- **Global:** เดือน 6+

### Channels
1. **PWA** (web) — share link ได้ตรงๆ
2. **Google Play** (ผ่าน Capacitor) — เดือน 2
3. **App Store** — เดือน 3
4. **Telegram Mini App** — สำรองไว้ phase 2 (ตลาด crypto/SEA)

### Marketing (low budget)
- TikTok organic — ทำ video "ฉัน vs daily puzzle"
- Reddit r/sudoku, r/puzzles
- Facebook group ไทย — กลุ่ม Sudoku/เกมฝึกสมอง
- Word of mouth ผ่าน leaderboard share

---

## 💰 ทำไมไม่ monetize ก่อน?

1. **Sudoku ตลาดอิ่ม** — ต้องโดดเด่นด้วย UX ก่อน ไม่ใช่ ads
2. **Monetization ทำลาย retention** ในช่วง early — Sudoku.com เป็นตัวอย่าง
3. **DAU เป็น asset** — ถ้ามี DAU 50k ค่อยใส่ ads / subscription = passive income ทันที
4. **Optionality** — มี DAU แล้วเลือก path ได้เยอะ: ads, subscription, ขายให้ publisher, sponsorship

**Plan สำหรับ monetize ใน phase 4+:**
- Subscription $2.99/เดือน: ตัด ads + premium themes + cloud sync ข้ามอุปกรณ์
- Rewarded ads: ดู ad แลก streak freeze / extra hint
- ห้ามมี interstitial ads (เกลียดผู้ใช้)
