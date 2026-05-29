# ✅ TASK.md — Sudoku Daily

> **Last updated:** 2026-05-30
> **Rule:** แต่ละ task ≤ 2 ชั่วโมง · ถ้าใหญ่กว่า → แตกเป็น sub-task
> **Legend:** ✅ Done · 🟡 In progress · ⏳ Todo · ⏭️ Blocked
> **Priority:** 🔴 P0 (must) · 🟡 P1 (should) · 🟢 P2 (nice) · ⚪ P3 (later)

---

## 📊 Quick Status

| Phase | Progress | Remaining tasks |
|---|---|---|
| Phase 0 — Foundation | ✅ 100% | 0 |
| Phase 1 — MVP | 🟡 ~75% | 6 |
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

### 1C. Leaderboard UI ✅ DONE (2026-05-30)
- [x] 🔴 P0 — `src/lib/api.ts`: `getLeaderboard(date, limit)` ใช้ `leaderboard_view`
- [x] 🔴 P0 — `src/ui/views/leaderboard.ts`: list view + rank/medals/name/time/score
- [x] 🔴 P0 — Highlight current user row + "Scroll to my rank" button + flash animation
- [x] 🔴 P0 — Supabase Realtime channel `lb:<date>` → refetch on insert/update
- [x] 🟡 P1 — Empty state + shimmer loading skeleton + error retry
- [x] 🟡 P1 — Tabs: Today / Yesterday (All-time ทำเสริมหลัง Phase 1)

### 1D. Daily Quest UI ✅ DONE (2026-05-30)
- [x] 🟡 P1 — `src/ui/views/quests.ts`: progress-bar row + claim button per quest
- [x] 🟡 P1 — Wire `getDailyQuests()` + `claimQuestReward()` API ใน home card
- [x] 🟡 P1 — Toast on claim + optimistic refresh
- [ ] 🟢 P2 — Quest history view (last 7 days) — เลื่อนไป Phase 2

### 1E. Streak Counter ✅ DONE (2026-05-30)
- [x] 🟡 P1 — `refreshStreakAndToast()` ดึง `user_progression` หลัง submit
- [x] 🟡 P1 — Streak badge in home header (🔥 + number) — มีมาตั้งแต่ Phase 0
- [x] 🟡 P1 — "Streak saved!" toast + milestone toast (3, 7, 14, 30, 60, 100, 365)

### 1F. Onboarding Wizard ✅ DONE (2026-05-30)
- [x] 🟢 P2 — Step 1: welcome + nickname input (saved to `profiles.display_name`)
- [x] 🟢 P2 — Step 2: how-to-play (3-bullet list)
- [x] 🟢 P2 — Step 3: daily-reminder prompt (accept/skip choice tracked)
- [x] 🟢 P2 — Step 4: "Let's play!" CTA + persist `sudoku_onboarded_v1` in localStorage
- [x] 🟢 P2 — Skip button + dot indicators + analytics events

### 1G. Push Notifications ⏭️ DEFERRED to post-Phase-1
- [ ] 🟢 P2 — Capacitor Push plugin install + Android FCM config (~45 น.)
- [ ] 🟢 P2 — iOS APNs cert setup + capability (~45 น.)
- [ ] 🟢 P2 — Server-side: edge function ส่ง notification 9:00 local (~30 น.)
- _หมายเหตุ: ต้องการ FCM/APNs credentials จริง + native build → ขยับไปทำคู่ Play Store/App Store ใน Phase 4_

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

## 🎯 Recommended Next Steps

Phase 1 ฟีเจอร์โค้ดเสร็จแล้ว (1A–1F) — ที่เหลือคือ launch tasks:

1. 🔴 **1Z** Soft launch + แชร์ link → เก็บ metrics (D1/D7 retention, completion rate)
2. 🟡 **1G** Push notifications (FCM + APNs setup) → ทำคู่ Play Store ใน 4C
3. 🔴 **4C** Sign + submit Android release → Play Internal Testing
4. 🟡 **4D** TestFlight submission
5. 🔴 **4E** Privacy Policy + ToS (ต้องมีก่อน submit store)

→ Phase 1 จะปิดเมื่อถึง exit criteria (500 users, D7 > 15%, completion > 50%)
