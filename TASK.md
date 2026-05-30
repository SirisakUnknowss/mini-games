# ✅ TASK.md — Sudoku Daily

> **Last updated:** 2026-05-30
> **Rule:** แต่ละ task ≤ 2 ชั่วโมง · ถ้าใหญ่กว่า → แตกเป็น sub-task
> **Legend:** ✅ Done · 🟡 In progress · ⏳ Todo · ⏭️ Blocked
> **Priority:** 🔴 P0 (must) · 🟡 P1 (should) · 🟢 P2 (nice) · ⚪ P3 (later)

---

## 📊 Quick Status — separated tracks

**Code** = สิ่งที่เขียน/commit ได้ในรอบ PR · **Launch** = ต้อง external accounts หรือ real users

| Phase | Code | Launch / External | Remaining code tasks |
|---|---|---|---|
| Phase 0 — Foundation | ✅ 100% | ✅ 100% (released) | 0 |
| Phase 1 — MVP | ✅ 100% | ⏳ 0% (soft launch + 500 users) | 0 |
| Phase 2 — Customization | 🟡 95% | — N/A | 1 (animated bg pattern) |
| Phase 3 — Progression | 🟡 85% | — N/A | 2 (global compare + weekly email infra) |
| Phase 4 — Polish & Launch | ✅ 100% | ⏳ 0% (Play+App Store submission) | 0 |
| Phase 5 — Monetization | 🟡 30% | ⏳ 0% (RevenueCat/AdMob accounts) | 5 (gates + premium flows) |

**Overall:** Code **~85%** · Launch **~10%**

---

## ✅ Phase 0 — Foundation (DONE @ v0.0.0)

ดู [PROGRESS.md](./PROGRESS.md) สำหรับรายละเอียดครบ — ทุกอย่าง done แล้ว

---

## 🟡 Phase 1 — MVP (Daily / Leaderboard / Streak)

> **Code track:** ✅ 100% (1A–1F shipped) · **Launch track:** ⏳ 0% (real users + push notif)

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

### 1Z. Phase 1 Exit Criteria (🚀 Launch track — ไม่ใช่ code)
- [ ] 🔴 P0 — Real users signed up ≥ 500
- [ ] 🔴 P0 — D1 retention > 35%, D7 retention > 15%
- [ ] 🔴 P0 — Daily completion rate > 50%
- [ ] 🔴 P0 — No P0/P1 bugs open
- [ ] 🔴 P0 — Soft launch executed

> 📌 ทั้งหมดในส่วนนี้ทำได้หลัง launch จริง — ไม่นับใน **Code track**

---

## ⏳ Phase 2 — Customization

### 2A. Coin Economy ✅ DONE
- [x] 🟡 P1 — Coin balance widget (header) — already from Phase 0
- [x] 🟡 P1 — Coin update reflected after purchase (optimistic)
- [x] 🟢 P2 — Coin count-up animation + floating "−N 💰" indicator (`src/lib/animate.ts`)
- [ ] 🟢 P2 — Audit ledger view (debug) — เลื่อน

### 2B. Shop ✅ DONE (2026-05-30)
- [x] 🟡 P1 — `src/ui/views/shop.ts`: grid + tabs (All / Themes / BG / Avatars)
- [x] 🟡 P1 — Buy flow via `purchaseItem()` RPC + optimistic coin deduct
- [x] 🟡 P1 — Owned / Equipped states + Equip button per category
- [x] 🟢 P2 — Filter by category tab

### 2C. Themes & Backgrounds ✅ DONE
- [x] 🟡 P1 — `src/lib/themes.ts`: 11 themes (Classic, Paper, Dark, Pastel, Ocean,
  Forest, Sunset, Neon, Sakura, Thai, Mono Pro) — full CSS-var override
- [x] 🟡 P1 — Apply theme on boot จาก `user_equipped` + cached localStorage
- [ ] 🟢 P2 — Animated backgrounds (rain etc.) — เลื่อน

### 2D. Avatar System ✅ DONE
- [x] 🟢 P2 — Avatar picker (21 emoji) ใน profile view
- [x] 🟢 P2 — Equip persists to `user_equipped.avatar` (with local fallback)
- [x] 🟢 P2 — Leaderboard view already pulls `avatar` from `leaderboard_view`

### 2E. Preview Mode ✅ DONE (2026-05-30)
- [x] 🟢 P2 — Theme preview on hover/touch ใน shop — applies theme live, restores on leave/unmount
- [x] 🟢 P2 — Premium badge + paywall trigger สำหรับ premium-only themes

---

## ⏳ Phase 3 — Progression

### 3A. XP & Level System ✅ DONE (2026-05-30)
- [x] 🟡 P1 — XP bar in home header (`xp-bar`) + level number from `levelProgress()`
- [x] 🟡 P1 — Level-up modal (`src/ui/views/level-up.ts`) shown 600ms after win
- [x] 🟡 P1 — XP curve: `xpForLevel(L) = (L-1) * L * 50` (quadratic, scales forever)
- [x] 🟡 P1 — Unit tests for level math (8 tests, all pass)

### 3B. Achievements (53 total now) ✅ DONE (2026-05-30)
- [x] 🟡 P1 — `src/ui/views/achievements.ts`: grid + tier color + lock/unlock states
- [x] 🟡 P1 — Category tabs (All + dynamic) + hidden-achievement support
- [x] 🟡 P1 — Migration `20260530000000_phase3_more_achievements.sql` — adds 33 new entries (total → 53)
- [x] 🟢 P2 — Inline progress bar for ACH_PLAY_*, ACH_STREAK_*, ACH_LEVEL_* — client-side calc from `user_game_history` + store

### 3C. Stats Dashboard ✅ DONE (2026-05-30)
- [x] 🟡 P1 — `src/ui/views/stats.ts`: games, best/avg time, streaks, mistakes/game
- [x] 🟡 P1 — Difficulty breakdown bars from `user_game_history`
- [x] 🟢 P2 — Time-per-game line chart (`src/lib/chart.ts` — vanilla canvas, no deps)
- [ ] 🟢 P2 — Compare-to-global-average (needs server aggregation view)

### 3D. Weekly Recap
- [ ] 🟢 P2 — Edge function: ส่ง weekly summary ทุกวันจันทร์ — เลื่อน (ต้อง email infra)
- [x] 🟢 P2 — Recap view in-app (`src/ui/views/recap.ts`) — last 7 days, share button

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
- [x] 🔴 P0 — Keystore generator script (`scripts/generate-keystore.sh`)
- [x] 🔴 P0 — Release build script (`scripts/release-android.sh`) → AAB + APK
- [x] 🔴 P0 — `docs/RELEASE.md` — full release guide
- [ ] 🔴 P0 — Run keystore generator (manual — needs you)
- [ ] 🔴 P0 — Play Console account ($25) + app listing draft (~1 ชม.)
- [ ] 🔴 P0 — Submit to Play Internal Testing track (~45 น.)

### 4D. App Store
- [ ] 🟡 P1 — App Store Connect listing draft (~1 ชม.)
- [ ] 🟡 P1 — Screenshots (6.7" + 6.5" + iPad) (~1 ชม.)
- [ ] 🟡 P1 — Submit to TestFlight (~45 น.)

### 4E. Web presence ✅ DONE (2026-05-30)
- [x] 🟡 P1 — Landing page (`landing/index.html`) — hero + features + CTA buttons
- [x] 🔴 P0 — Privacy Policy (`legal/PRIVACY.md`)
- [x] 🔴 P0 — Terms of Service (`legal/TERMS.md`)

---

## ⏳ Phase 5 — Monetization

### 5A. Subscription
- [ ] 🟢 P2 — RevenueCat integration (~1.5 ชม.) — ต้อง RevenueCat account
- [ ] 🟢 P2 — Premium gate: themes + stats history + no-ads (~1 ชม.)
- [x] 🟢 P2 — Paywall view (`src/ui/views/paywall.ts`) — UI stub, ยังไม่ wire IAP จริง

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
