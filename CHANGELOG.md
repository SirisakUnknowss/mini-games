# Changelog

ประวัติทุก version ของโปรเจ็กต์ — ตามรูปแบบ [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) +
[Semantic Versioning](https://semver.org/).

Release notes ละเอียดของแต่ละ version อยู่ในโฟลเดอร์ [`releases/`](./releases/).

---

## [Unreleased]

### Phase 1 — MVP (in progress)
ดู [PROGRESS.md](./PROGRESS.md) + [TASK.md](./TASK.md) สำหรับ task breakdown

#### Added
- Task 1A — Daily puzzle backend live บน Supabase Cloud (7 migrations, 2 edge functions, pg_cron, 30 puzzles pre-generated)
- Task 1B — Auth UI (sign in / sign up / anonymous → email upgrade) พร้อม validation + analytics events
- **Task 1C** — Leaderboard view เต็มฟีเจอร์: Today/Yesterday tabs, current-user highlight,
  "Scroll to my rank" + flash animation, shimmer skeleton, empty/error states with retry,
  Supabase Realtime channel for live updates (`src/ui/views/leaderboard.ts`)
- **Task 1D** — Daily Quest UI: progress bars, claim button per quest, wired to
  `getDailyQuests()` + `claimQuestReward()` with optimistic refresh (`src/ui/views/quests.ts`)
- **Task 1E** — Streak integration: `refreshStreakAndToast()` after daily submit,
  "Streak saved" toast + milestone toasts on 3/7/14/30/60/100/365, fires
  `STREAK_MILESTONE` / `STREAK_LOST` analytics events
- **Task 1F** — 4-step Onboarding wizard (welcome+nickname → how-to-play →
  daily-reminder prompt → "Let's play" CTA) with dot indicators, skip support,
  persisted via `localStorage.sudoku_onboarded_v1` (`src/ui/views/onboarding.ts`)
- `TASK.md` — subtask breakdown ย่อย ๆ ทุก phase พร้อม priority + status + ประมาณเวลา

#### Changed
- `README.md` — ปรับเป็น hub ของทั้ง 3 เกม, ชู Sudoku Daily เป็นเกมหลัก, เพิ่ม roadmap table + คำสั่งรัน web/Android/iOS
- `src/main.ts` — wire Leaderboard route, render Daily Quests on home, trigger
  onboarding on first boot, refresh streak post-submit
- `src/ui/styles/main.css` — เพิ่ม CSS สำหรับ leaderboard / quest / onboarding components

#### Deferred
- **Task 1G** Push notifications — เลื่อนไปทำคู่ Play Store / App Store submission ใน Phase 4 (ต้อง FCM + APNs credentials จริง)

---

## [v0.0.0] — 2026-05-24

🎉 **Initial release** — Phase 0 (Foundation) complete

**Highlights:**
- Sudoku Daily v2 — TypeScript + Vite + PWA + Capacitor
- 37/37 unit tests passing, ~65 KB initial bundle gzipped
- Mobile builds: Android APK (5.9 MB) + iOS Simulator
- 5 Supabase migrations + edge function with full anti-cheat
- 40 docs files across 7 sections
- Animated splash + custom icons (incl. Android 13+ monochrome)

📦 [Full release notes](./releases/v0.0.0.md)
🔗 [GitHub Release](https://github.com/SirisakUnknowss/mini-games/releases/tag/v0.0.0)

[Unreleased]: https://github.com/SirisakUnknowss/mini-games/compare/v0.0.0...HEAD
[v0.0.0]: https://github.com/SirisakUnknowss/mini-games/releases/tag/v0.0.0
