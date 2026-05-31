# 📊 Progress Update — Sudoku Daily

> **Last updated:** 2026-05-31
> **Current release:** [v0.1.0](https://github.com/SirisakUnknowss/mini-games/releases/tag/v0.1.0) — submitting to Play Store / App Store
> **Branch:** `main`

---

## 🎯 ภาพรวม — 2 dimensions

แยกชัดระหว่าง **Code** (สิ่งที่ commit ได้) กับ **Launch** (ต้อง external accounts / real users)

```
                                     Code                       Launch / External
Phase 0 — Foundation              ████████████████████ 100% ✅ │ ████████████████████ 100% ✅ (v0.0.0 released)
Phase 1 — MVP                     ████████████████████ 100% ✅ │ ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (soft launch + 500 users)
Phase 2 — Customization           ████████████████████ 100% ✅ │ ─── N/A
Phase 3 — Progression             ███████████████████░  95% 🟡 │ ─── N/A (weekly email only)
Phase 4 — Polish & Launch         ████████████████████ 100% ✅ │ ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (Play+App Store submission)
Phase 5 — Monetization            ██████░░░░░░░░░░░░░░  30% 🟡 │ ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (RevenueCat + AdMob)

Code progress to v1.0:            ██████████████████░░  90%
Launch progress to v1.0:          ██░░░░░░░░░░░░░░░░░░  10%
```

### ทำไมแยก 2 อัน?
- **Code** = สิ่งที่ผม/คุณเขียนใน PR ได้ → ตัวบ่งบอกความพร้อมของ product
- **Launch** = ต้องเปิด account จริง ($25 Play, $99/yr Apple, RevenueCat etc.) + เก็บ retention metrics จาก users จริง
- Code 100% ไม่ได้แปลว่า launch สำเร็จ — Launch 0% ไม่ได้แปลว่าโค้ดไม่เสร็จ

---

## ✅ Phase 0 — Foundation (DONE @ v0.0.0)

### Architecture
- [x] TypeScript + Vite + PWA setup
- [x] Pure engine layer (generator, solver with uniqueness, validator, scoring, quests, rng)
- [x] Lib layer (supabase, auth, api, analytics, migrate-v1, local-db, format)
- [x] UI layer (game, home, splash, win-modal, board, numpad, styles)
- [x] State management (Zustand)

### Quality
- [x] 37/37 unit tests passing (vitest)
- [x] TypeScript strict mode
- [x] ESLint + Prettier
- [x] Production build ~65 KB gzip
- [x] Self-check script: `npm run phase0:verify`

### Infrastructure
- [x] 5 SQL migrations + seed (shop items + achievements)
- [x] Edge function: `submit-daily-score` with anti-cheat
- [x] 3 GitHub Actions workflows
- [x] PostHog analytics integration (no-op safe)
- [x] Sentry error tracking integration (no-op safe)
- [x] v1 → v2 migration logic (idempotent boot)

### Mobile (Phase 4 prep done early — bonus)
- [x] Capacitor 8 wrap
- [x] Android APK builds (5.9 MB)
- [x] iOS .app builds (Simulator)
- [x] 120+ icon assets generated
- [x] Adaptive icon + monochrome layer (Android 13+ themed icons)
- [x] Animated splash screen (logo pop, grid draw, numbers cascade)

### Docs
- [x] 40 markdown files in `sudoku/docs/` (7 sections)

### Released
- [x] GitHub repo: https://github.com/SirisakUnknowss/mini-games
- [x] Tag `v0.0.0`
- [x] Release with APK attached

---

## 🟡 Phase 1 — MVP (Code ✅ 100% · Launch ⏳ 0%)

**Goal:** Daily Puzzle + Leaderboard + Daily Quest + Streak ทำงานได้จริง → soft launch

**Exit criteria:**
- 500+ real users signed up
- D7 retention > 15%
- Daily completion rate > 50%

### Done already (in v0.0.0)
- [x] Puzzle engine + uniqueness check
- [x] Daily puzzle UI shell (offline mode)
- [x] Game flow + scoring
- [x] Auth code (stub working)
- [x] Win modal + share text
- [x] Edge function `submit-daily-score` (anti-cheat ready)
- [x] Edge function `grant_coins`, `grant_xp`, `bump_streak_for_today`

### Remaining — เลือกทำตามลำดับนี้ (priority order)

| # | Task | Effort | Status | Priority |
|---|---|---|---|---|
| 1A | Daily Puzzle fetch จาก Supabase + Cron gen 30 วัน | ~3 ชม. | ✅ DONE | 🔴 P0 |
| 1B | Auth UI (sign up, sign in, anonymous → email link) | ~2 ชม. | ✅ DONE | 🔴 P0 |
| 1C | Leaderboard UI + Realtime updates | ~3 ชม. | ✅ DONE | 🔴 P0 |
| 1D | Daily Quest UI + claim flow | ~2 ชม. | ✅ DONE | 🟡 P1 |
| 1E | Streak counter + UI integration | ~1 ชม. | ✅ DONE | 🟡 P1 |
| 1F | Onboarding wizard (4 steps) | ~2 ชม. | ✅ DONE | 🟢 P2 |
| 1G | Push notifications setup | ~2 ชม. | ⏭️ Deferred | 🟢 P2 |

**Phase 1 feature code complete** — เหลือเฉพาะ 1G (ต้อง FCM/APNs จริง — ไปทำคู่ Play Store ใน Phase 4)
และ launch tasks: real users + retention metrics (1Z exit criteria)

### Tasks 1C-1F completion details (2026-05-30)
- ✅ `src/ui/views/leaderboard.ts` — list view, Today/Yesterday tabs, current-user
  highlight, "Scroll to my rank" with flash animation, shimmer skeleton, empty/error
  states with retry, Supabase Realtime channel `lb:<date>` subscribed for live updates
- ✅ `src/ui/views/quests.ts` — quest rows with progress bar + claim button, wired
  to `getDailyQuests()` + `claimQuestReward()`, optimistic refresh on success
- ✅ `src/ui/views/onboarding.ts` — 4-step wizard (welcome+nickname, how-to-play,
  daily-reminder prompt, "Let's play" CTA), dots indicator, skip support,
  persisted via `localStorage.sudoku_onboarded_v1`
- ✅ `src/main.ts` — `refreshStreakAndToast()` re-fetches `user_progression` post-
  submit, fires `STREAK_MILESTONE` analytics on (3/7/14/30/60/100/365), triggers
  onboarding on first boot, wires Leaderboard route and Daily Quests home card
- ✅ CSS: leaderboard tabs/rows/skeleton, quest rows, onboarding modal (dots, emoji,
  list, choices)
- ✅ Typecheck + build + 37/37 tests pass; bundle still ~80 KB gzip (index)

### Task 1B completion details (2026-05-28)
- ✅ `src/lib/auth.ts` — added `upgradeAnonymousToEmail()` + `isAnonymous()`
- ✅ `src/ui/views/auth-modal.ts` — sign in / sign up / upgrade modal with tabs,
  inline validation, error display, loading states
- ✅ CSS: auth modal, save-progress banner, "guest" badge tag, close button
- ✅ `src/ui/views/home.ts` — clickable user-badge, "Save progress" banner
  shown only to anonymous users
- ✅ `src/main.ts` — wired `openAuthAction()` (anonymous → upgrade prompt,
  signed-in → profile menu / sign-out, no user → sign-in modal) and
  `openProfileMenu()` (confirm-then-signOut + auto re-anonymous boot)
- ✅ Analytics events: SIGN_IN, SIGN_UP, ANONYMOUS_UPGRADED
- ✅ Typecheck + build + tests (37/37) all pass

### Task 1A completion details (2026-05-27)
- ✅ Supabase Cloud project `sudoku-daily` (Seoul ap-northeast-2)
- ✅ 7 migrations applied (init + RLS + triggers + views + RPC + security hardening + cron)
- ✅ Seed data: 36 shop items + 19 achievements
- ✅ Edge function `submit-daily-score` (anti-cheat + grants + rank)
- ✅ Edge function `generate-daily-puzzle` (Sudoku engine ported to Deno)
- ✅ 30 daily puzzles pre-generated (2026-05-27 → 2026-06-25)
- ✅ pg_cron scheduled (23:00 UTC daily)
- ✅ Security advisors: 17 → 5 (remaining are intentional WARNs for RPC by design)
- ✅ End-to-end tested: client → Supabase REST → daily_puzzles_public view works

---

## 🚀 Next Step ที่แนะนำ

### Suggested path: ทำเรียงตาม dependency

```
1A (Daily Puzzle backend)
    ↓ ต้องมี puzzle จาก server ก่อน
1B (Auth UI)
    ↓ ต้อง login ได้จริงเพื่อ submit score
1C (Leaderboard)
    ↓ ต้องมี submission ที่ผ่าน auth ก่อน
1E (Streak) ← เร็ว, ทำคู่กับ 1C ได้
    ↓
1D (Daily Quest UI)
    ↓
1F (Onboarding)
    ↓
1G (Push notifications)
```

**Quick win:** เริ่มที่ **1A** ก่อน — เพราะ backend ส่วนใหญ่พร้อมแล้ว ขาดแค่ deploy + UI wire up

**Min viable Phase 1:** ทำ **1A + 1B + 1C + 1E** (~9 ชม.) ก็ launch ได้แล้ว
**Full Phase 1:** ทำครบ 7 อัน (~15 ชม.) → polished MVP

---

## 📌 Things to remember when resuming

### Setup ที่ยังไม่ได้ทำ
- [ ] **Supabase Cloud project** — สร้างที่ supabase.com → `supabase link` → `supabase db push`
- [ ] **`.env.local`** — copy จาก `.env.example` + เติม Supabase URL/key
- [ ] **PostHog project** (optional, free tier)
- [ ] **Sentry project** (optional, free tier)

### File ที่จะแก้บ่อยใน Phase 1
- `src/main.ts` — routing + boot flow
- `src/lib/api.ts` — เพิ่ม API calls
- `src/ui/views/` — เพิ่ม leaderboard.ts, profile.ts, shop.ts, settings.ts, auth.ts
- `supabase/functions/` — เพิ่ม edge functions อื่นๆ
- `supabase/migrations/` — เพิ่ม migrations ใหม่ (ห้ามแก้เก่า)

### Phase 1 Definition of Done
- [ ] Real user สมัครจริง ≥ 500 คน
- [ ] D1 retention > 35%
- [ ] D7 retention > 15%
- [ ] Daily puzzle completion rate > 50%
- [ ] No P0/P1 bugs
- [ ] Soft launch executed

---

## 🟢 Phase 4 — Polish (30% done, ก่อนกำหนด)

ที่ทำไปแล้ว:
- [x] PWA service worker + manifest
- [x] Capacitor setup
- [x] Android APK builds
- [x] iOS app builds (Simulator-ready)
- [x] Custom icons (incl. monochrome for Android 13+)
- [x] Animated splash screen

เหลือ (ทำหลัง Phase 1):
- [ ] ลง iPhone จริง (free dev mode 7 วัน หรือ $99 Apple Developer)
- [ ] Sign Release APK + keystore
- [ ] Play Store submission ($25)
- [ ] App Store submission ($99/ปี)
- [ ] Landing page
- [ ] Privacy Policy
- [ ] Terms of Service

---

## 📦 Phases ที่ยังไม่เริ่ม

### Phase 2 — Customization (0%)
- Coin economy + Shop
- Themes + Backgrounds
- Avatar system
- Preview mode

### Phase 3 — Progression (0%)
- XP + Level system
- 50+ achievements
- Stats dashboard
- Weekly recap

### Phase 5 — Monetization (0%)
- Subscription
- Rewarded ads
- IAP coin packs

---

## 🔗 Quick Links

| Resource | URL |
|---|---|
| GitHub Repo | https://github.com/SirisakUnknowss/mini-games |
| Latest Release | https://github.com/SirisakUnknowss/mini-games/releases/tag/v0.0.0 |
| APK Download | [sudoku-daily-v0.0.0.apk](https://github.com/SirisakUnknowss/mini-games/releases/download/v0.0.0/sudoku-daily-v0.0.0.apk) |
| Docs index | [sudoku/docs/README.md](./sudoku/docs/README.md) |
| Vision | [sudoku/docs/00-overview/vision.md](./sudoku/docs/00-overview/vision.md) |
| Roadmap | [sudoku/docs/00-overview/roadmap.md](./sudoku/docs/00-overview/roadmap.md) |
| Dev onboarding | [sudoku/docs/06-implementation/developer-onboarding.md](./sudoku/docs/06-implementation/developer-onboarding.md) |

---

## 💡 Resume checklist

ถ้ากลับมาทำต่อหลังจากนี้:

```bash
# 1. Pull latest
cd /Users/unknowss/Documents/GitHub/mini-games
git pull

# 2. Verify environment
cd sudoku
npm install
npm run phase0:verify

# 3. Read this file (PROGRESS.md) → ดูว่าจะทำอะไรต่อ

# 4. Setup Supabase (ถ้ายังไม่มี)
#    - Create project at supabase.com
#    - supabase link --project-ref <id>
#    - supabase db push
#    - Copy URL + anon key → .env.local

# 5. Start coding
npm run dev
```

---

**Status @ end of v0.0.0:** ✅ Clean checkpoint. ทุกอย่าง commit + push เรียบร้อย. Engine + infra พร้อม build feature ใหม่ทันที.
