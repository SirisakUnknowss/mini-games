# ✅ TASK.md — Sudoku Daily

> **Last updated:** 2026-05-28
> **Rule:** แต่ละ task ≤ 2 ชั่วโมง · ถ้าใหญ่กว่า → แตกเป็น sub-task
> **Legend:** ✅ Done · 🟡 In progress · ⏳ Todo · ⏭️ Blocked
> **Priority:** 🔴 P0 (must) · 🟡 P1 (should) · 🟢 P2 (nice) · ⚪ P3 (later)

---

## 📊 Quick Status

| Phase | Progress | Remaining tasks |
|---|---|---|
| Phase 0 — Foundation | ✅ 100% | 0 |
| Phase 1 — MVP | 🟡 ~30% | 22 |
| Phase 2 — Customization | ⏳ 0% | 14 |
| Phase 3 — Progression | ⏳ 0% | 12 |
| Phase 4 — Polish & Launch | 🟡 30% | 11 |
| Phase 5 — Monetization | ⏳ 0% | 9 |

---

## ✅ Phase 0 — Foundation (DONE @ v0.0.0)

ดู [PROGRESS.md](./PROGRESS.md) สำหรับรายละเอียดครบ — ทุกอย่าง done แล้ว

---

## 🟡 Phase 1 — MVP (Daily / Leaderboard / Streak)

### 1A. Daily Puzzle Backend ✅ DONE
- [x] 🔴 P0 — Supabase Cloud project สร้าง + link
- [x] 🔴 P0 — Apply 7 migrations (init/RLS/triggers/views/RPC/security/cron)
- [x] 🔴 P0 — Seed shop items (36) + achievements (19)
- [x] 🔴 P0 — Deploy edge function `submit-daily-score`
- [x] 🔴 P0 — Deploy edge function `generate-daily-puzzle`
- [x] 🔴 P0 — Pre-generate 30 daily puzzles
- [x] 🔴 P0 — pg_cron schedule 23:00 UTC
- [x] 🔴 P0 — Wire client → `daily_puzzles_public` view

### 1B. Auth UI ✅ DONE
- [x] 🔴 P0 — `upgradeAnonymousToEmail()` + `isAnonymous()` helpers
- [x] 🔴 P0 — Auth modal (sign in / sign up / upgrade tabs)
- [x] 🔴 P0 — Inline validation + error display + loading states
- [x] 🔴 P0 — Home: clickable user-badge + "Save progress" banner
- [x] 🔴 P0 — `openAuthAction()` + `openProfileMenu()` flow
- [x] 🔴 P0 — Analytics: SIGN_IN, SIGN_UP, ANONYMOUS_UPGRADED

### 1C. Leaderboard UI ⏳ (~3 ชม. → แตกเป็น 4 ย่อย)
- [ ] 🔴 P0 — `src/lib/api.ts`: เพิ่ม `fetchLeaderboard(date)` + types (~30 น.)
- [ ] 🔴 P0 — `src/ui/views/leaderboard.ts`: list view + rank/name/time/score (~1 ชม.)
- [ ] 🔴 P0 — Highlight current user row + scroll-to-me button (~30 น.)
- [ ] 🔴 P0 — Supabase Realtime subscribe → update on new submission (~1 ชม.)
- [ ] 🟡 P1 — Empty state + loading skeleton + error retry (~30 น.)
- [ ] 🟡 P1 — Tab: Today / Yesterday / All-time (~45 น.)

### 1D. Daily Quest UI ⏳ (~2 ชม.)
- [ ] 🟡 P1 — Quest card component (title, progress bar, claim button) (~45 น.)
- [ ] 🟡 P1 — `fetchTodayQuest()` + `claimQuest()` API wrappers (~30 น.)
- [ ] 🟡 P1 — Toast + coin animation on claim (~30 น.)
- [ ] 🟢 P2 — Quest history view (last 7 days) (~30 น.)

### 1E. Streak Counter ⏳ (~1 ชม.)
- [ ] 🟡 P1 — `fetchStreak()` API + cache in Zustand (~20 น.)
- [ ] 🟡 P1 — Streak badge in home header (🔥 icon + number) (~20 น.)
- [ ] 🟡 P1 — "Streak saved!" toast หลังชนะรายวัน (~20 น.)

### 1F. Onboarding Wizard ⏳ (~2 ชม.)
- [ ] 🟢 P2 — Step 1: welcome + nickname input (~30 น.)
- [ ] 🟢 P2 — Step 2: how-to-play (3-row carousel) (~30 น.)
- [ ] 🟢 P2 — Step 3: enable notifications prompt (~30 น.)
- [ ] 🟢 P2 — Step 4: first daily puzzle CTA + persist `onboarded=true` (~30 น.)

### 1G. Push Notifications ⏳ (~2 ชม.)
- [ ] 🟢 P2 — Capacitor Push plugin install + Android FCM config (~45 น.)
- [ ] 🟢 P2 — iOS APNs cert setup + capability (~45 น.)
- [ ] 🟢 P2 — Server-side: edge function ส่ง notification 9:00 local (~30 น.)

### 1Z. Phase 1 Exit Criteria
- [ ] 🔴 P0 — Real users signed up ≥ 500
- [ ] 🔴 P0 — D1 retention > 35%, D7 retention > 15%
- [ ] 🔴 P0 — Daily completion rate > 50%
- [ ] 🔴 P0 — No P0/P1 bugs open
- [ ] 🔴 P0 — Soft launch executed

---

## ⏳ Phase 2 — Customization

### 2A. Coin Economy
- [ ] 🟡 P1 — Coin balance widget (header) + RPC `get_coins()` (~30 น.)
- [ ] 🟡 P1 — Coin earn animation on win/quest claim (~30 น.)
- [ ] 🟡 P1 — Audit ledger view (debug) (~45 น.)

### 2B. Shop
- [ ] 🟡 P1 — Shop view: grid ของ items จาก `shop_items` (~1 ชม.)
- [ ] 🟡 P1 — Item detail modal + "Buy" RPC `purchase_item()` (~1 ชม.)
- [ ] 🟡 P1 — Owned/locked state + "Equip" toggle (~45 น.)
- [ ] 🟢 P2 — Filter: theme / background / avatar (~30 น.)

### 2C. Themes & Backgrounds
- [ ] 🟡 P1 — Theme tokens (CSS vars) — 5 themes base (~1 ชม.)
- [ ] 🟡 P1 — Apply selected theme on boot จาก user profile (~30 น.)
- [ ] 🟢 P2 — Background patterns (10 variants) (~1 ชม.)

### 2D. Avatar System
- [ ] 🟢 P2 — Avatar picker (12 default avatars) (~1 ชม.)
- [ ] 🟢 P2 — Premium avatars (จาก shop) (~45 น.)
- [ ] 🟢 P2 — Show avatar ใน leaderboard rows (~30 น.)

### 2E. Preview Mode
- [ ] 🟢 P2 — "Try before buy" preview ใน shop modal (~45 น.)

---

## ⏳ Phase 3 — Progression

### 3A. XP & Level System
- [ ] 🟡 P1 — XP bar in header + level number (~45 น.)
- [ ] 🟡 P1 — Level-up modal + reward grant (~45 น.)
- [ ] 🟡 P1 — XP curve table + RPC `grant_xp()` already exists — wire UI (~30 น.)

### 3B. Achievements (50+)
- [ ] 🟡 P1 — Achievements view: grid + locked/unlocked state (~1 ชม.)
- [ ] 🟡 P1 — Unlock toast + persist seen flag (~30 น.)
- [ ] 🟡 P1 — Migration: add 30+ achievements (เกินจาก 19 ปัจจุบัน) (~1 ชม.)
- [ ] 🟢 P2 — Progress bar สำหรับ multi-step achievements (~45 น.)

### 3C. Stats Dashboard
- [ ] 🟡 P1 — Personal stats: games played, win rate, avg time (~1 ชม.)
- [ ] 🟢 P2 — Charts: time-over-days, streaks history (~1 ชม.)
- [ ] 🟢 P2 — Compare to global average (~45 น.)

### 3D. Weekly Recap
- [ ] 🟢 P2 — Edge function: ส่ง weekly summary ทุกวันจันทร์ (~1 ชม.)
- [ ] 🟢 P2 — Recap view in-app (share-friendly image) (~1 ชม.)

---

## 🟡 Phase 4 — Polish & Launch

### 4A. Mobile builds (DONE early)
- [x] 🔴 P0 — Capacitor 8 wrap
- [x] 🔴 P0 — Android APK build pipeline (5.9 MB)
- [x] 🔴 P0 — iOS .app builds (Simulator)
- [x] 🔴 P0 — Adaptive + monochrome icons
- [x] 🔴 P0 — Animated splash screen

### 4B. iOS Distribution
- [ ] 🟡 P1 — ลง iPhone จริงผ่าน free dev mode 7 วัน (~30 น.)
- [ ] 🟡 P1 — Decide: $99 Apple Dev account (~15 น.)

### 4C. Android Release
- [ ] 🔴 P0 — Generate signing keystore + secure backup (~30 น.)
- [ ] 🔴 P0 — Build signed release APK + AAB (~45 น.)
- [ ] 🔴 P0 — Play Console account ($25) + app listing draft (~1 ชม.)
- [ ] 🔴 P0 — Submit to Play Internal Testing track (~45 น.)

### 4D. App Store
- [ ] 🟡 P1 — App Store Connect listing draft (~1 ชม.)
- [ ] 🟡 P1 — Screenshots (6.7" + 6.5" + iPad) (~1 ชม.)
- [ ] 🟡 P1 — Submit to TestFlight (~45 น.)

### 4E. Web presence
- [ ] 🟡 P1 — Landing page (one-pager + download CTAs) (~2 ชม.)
- [ ] 🔴 P0 — Privacy Policy (~45 น.)
- [ ] 🔴 P0 — Terms of Service (~45 น.)

---

## ⏳ Phase 5 — Monetization

### 5A. Subscription
- [ ] 🟢 P2 — RevenueCat integration (~1.5 ชม.)
- [ ] 🟢 P2 — Premium gate: themes + stats history + no-ads (~1 ชม.)
- [ ] 🟢 P2 — Paywall view (~1 ชม.)

### 5B. Rewarded Ads
- [ ] 🟢 P2 — AdMob SDK integrate (Capacitor plugin) (~1 ชม.)
- [ ] 🟢 P2 — "Watch ad for +50 coins" CTA (~45 น.)
- [ ] 🟢 P2 — Frequency cap + analytics (~30 น.)

### 5C. IAP Coin Packs
- [ ] 🟢 P2 — Define 4 SKUs (small/medium/large/mega) (~30 น.)
- [ ] 🟢 P2 — Purchase flow + receipt verification edge function (~1.5 ชม.)
- [ ] 🟢 P2 — Coin pack view in shop (~45 น.)

---

## 🎯 Recommended Next 5 Tasks

1. 🔴 **1C-1** `fetchLeaderboard(date)` ใน `src/lib/api.ts` (~30 น.)
2. 🔴 **1C-2** Leaderboard list view (~1 ชม.)
3. 🔴 **1C-4** Realtime subscribe (~1 ชม.)
4. 🟡 **1E-1+2+3** Streak counter ครบเซ็ต (~1 ชม.)
5. 🟡 **1D-1+2** Daily Quest card + API (~1.25 ชม.)

→ จบ 5 อันนี้ ≈ 5 ชม. แล้ว Phase 1 จะ ~70% (พอ soft launch ได้)
