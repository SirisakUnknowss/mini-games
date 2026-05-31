# Changelog

ประวัติทุก version ของโปรเจ็กต์ — ตามรูปแบบ [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) +
[Semantic Versioning](https://semver.org/).

Release notes ละเอียดของแต่ละ version อยู่ในโฟลเดอร์ [`releases/`](./releases/).

---

## [Unreleased]

---

## [v0.1.0] — 2026-05-31

🚀 **First feature release** — Phase 1-3 complete, ready for Play Store / App Store submission

📦 [Full release notes](./releases/v0.1.0.md)

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

### Phase 2 — Customization (2026-05-30)

#### Added
- **2B Shop** (`src/ui/views/shop.ts`) — full grid view with category tabs
  (All / Themes / Backgrounds / Avatars), rarity-colored borders, Buy + Equip
  flows wired to `purchaseItem()` / `equipItem()` RPCs with optimistic coin
  deduction and local fallback when the equip endpoint is unavailable
- **2C Theme system** (`src/lib/themes.ts`) — 11 themes (Classic, Paper, Dark,
  Pastel, Ocean, Forest, Sunset, Neon, Sakura, Thai, Mono Pro) applied via
  CSS custom property overrides; theme persists across reloads via
  localStorage cache and applied before first paint to avoid flicker
- **2D Avatar picker** — 21 emoji avatars in Profile view, equip persists to
  `user_equipped.avatar` (JSONB); equipped avatar shows in home header

### Phase 3 — Progression (2026-05-30)

#### Added
- **3A XP & Levels** (`src/lib/level.ts`) — quadratic curve
  `(L-1) * L * 50`; in-home XP bar with progress + "X to next level" label;
  level-up modal (`src/ui/views/level-up.ts`) shown 600ms after win
- **3B Achievements** (`src/ui/views/achievements.ts`) — grid view with tier
  color rings, lock/unlock states, category tabs, hidden achievement support;
  migration `20260530000000_phase3_more_achievements.sql` adds 33 entries
  (total now 53: play volume, daily/streak, skill, speedrun, leaderboard,
  progression levels, special/fun)
- **3C Stats dashboard** (`src/ui/views/stats.ts`) — games, best/avg time,
  current+longest streaks, mistakes/game; difficulty breakdown bars from
  `user_game_history`
- **`tests/engine/level.test.ts`** — 8 new unit tests for the XP curve
  (monotonicity, boundaries, progress fractions). Total now 45/45 passing.

### Phase 4 — Polish (2026-05-30)

#### Added
- **4E Web presence**
  - `legal/PRIVACY.md` — Privacy Policy (sections: data collection, use,
    sharing, choices, retention, security, contact)
  - `legal/TERMS.md` — Terms of Service (eligibility, account, acceptable use,
    virtual currency, IP, disclaimers, governing law)
  - `landing/index.html` — single-page marketing site with hero, 8 feature
    cards, and store CTAs

### Phase 5 — Monetization (2026-05-30)

#### Added
- **5A Paywall UI stub** (`src/ui/views/paywall.ts`) — premium features
  list, monthly/yearly plan selector, recommended badge. **Stub only** —
  real IAP/subscription wiring requires RevenueCat or App/Play Store Connect
  accounts and is left for post-launch.

#### Profile view (Phase 2/3 cross-cutting)
- `src/ui/views/profile.ts` — new dedicated Profile route with avatar picker,
  editable display name, stat tiles, and links into Stats / Achievements / Sign-out
- `src/main.ts` — Shop/Profile/Achievements/Stats routes wired; theme
  applied on boot from cached localStorage; level-up detected after submit
- `src/state/store.ts` — added `equipped`, `inventory`, `longestStreak`,
  `setEquipped()`, `setInventory()`, `addToInventory()`

### Polish round (2026-05-30)

#### Added
- **`src/lib/animate.ts`** — `countUp()` and `floatReward()` helpers
  (no deps, respects `prefers-reduced-motion`). Shop now animates the coin
  counter and floats a "−N 💰" indicator on purchase.
- **`src/lib/premium.ts`** — single source of truth for premium status
  (localStorage flag). 3 themes (Sakura, Thai, Mono Pro) marked premium —
  show ✨ badge and trigger the paywall when tapped if not owned.
- **Theme preview in shop** — hover/touch a theme card to preview it live;
  restore on leave or unmount.
- **`src/lib/chart.ts`** — tiny vanilla canvas line chart used in Stats
  to render last-60-games time-per-game. devicePixelRatio aware.
- **Achievement progress bars** — inline `progress/target` bars for
  ACH_PLAY_*, ACH_STREAK_*, ACH_LEVEL_* computed client-side from
  `user_game_history.count` + store state.
- **`src/ui/views/recap.ts`** — in-app Weekly Recap (last 7 days summary,
  share button via Web Share API + clipboard fallback). New row in Profile.

#### Release tooling (Phase 4)
- **`scripts/generate-keystore.sh`** — guided keytool wrapper with safety
  warnings about backup.
- **`scripts/release-android.sh`** — one-shot build of signed AAB + APK
  into `releases/sudoku-daily-v${version}.{aab,apk}`.
- **`docs/RELEASE.md`** — end-to-end release guide (Play Store, App Store,
  PWA hosting, GitHub Releases, secrets management, rollback playbook).
- **`sudoku/.gitignore`** — explicit deny for `*.keystore`, `keystore.properties`,
  and other release artifacts.

### Phase 2/3 finish — 100% code (2026-05-30)

#### Added
- **`src/lib/backgrounds.ts`** — background system with 9 options:
  default, blank white, navy/forest solids, dot + wave patterns, and 3
  animated (rain, twinkling stars, aurora borealis). All CSS-only,
  respects `prefers-reduced-motion`. Applied via single body class.
- **`src/ui/views/ledger.ts`** — Coin Ledger view showing total earned /
  spent / balance plus the 100 most recent `coin_transactions` entries.
- **Migration `20260530120000_phase3_global_stats.sql`** — adds
  `global_daily_stats` (per-day) and `global_stats_summary` (last 30 days)
  views with public SELECT for anonymous + authenticated.
- **Stats view: vs Global** — pulls `global_stats_summary` and shows
  "X% faster/slower than global average" + "X% fewer/more mistakes"
  with sample size disclosure.
- **Achievement progress bars** extended — now covers ACH_PLAY_*,
  ACH_DAILY_*, ACH_STREAK_*, ACH_PERFECT_*, ACH_LEVEL_*, ACH_RICH,
  ACH_THEME_COLLECT (22 IDs total). Counts derived from
  `user_game_history` heads + store state.

#### Fixed
- Stats / Recap views were querying the wrong column names
  (`played_at` → `completed_at`, `difficulty` → `level`). Both views
  would have silently failed on real data.

#### Changed
- Shop equip flow now also applies the equipped background.
- Boot loads + applies cached background id before first paint.
- Profile view adds Coin Ledger row.

### New game: 2048 (`2048/`)

#### Added
- **`2048/index.html`** + `style.css` + `db.js` + `game.js` + `app.js` —
  vanilla JS, no build step, plays from a `file://` URL. Matches the pattern
  of `match-three/` and `suika/`.
- 4×4 board, swipe (mobile) + arrow/WASD/HJKL (desktop) controls
- Undo (1 step), New Game, persistent saved board across sessions
- Multi-user login (per-game, `g2048_db_v1` localStorage namespace)
- Stats: total games, total score, high score, highest tile, play time
- Global leaderboard view (sorted by high score)
- Profile view with change password / reset / delete account

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
