# 🎮 Mini Games Collection

โปรเจกต์รวมเกมเล่นใน browser — มีตั้งแต่เกม Vanilla JS เล่นได้เลย ไปจนถึง Sudoku Daily ที่เป็น PWA + mobile app เต็มรูปแบบพร้อม Supabase backend

> **Current release:** [v0.0.0](https://github.com/SirisakUnknowss/mini-games/releases/tag/v0.0.0) — Sudoku Daily MVP
> **Status:** Phase 0 ✅ · Phase 1 🟡 ~30% — ดู [PROGRESS.md](./PROGRESS.md) · [TASK.md](./TASK.md) · [CHANGELOG.md](./CHANGELOG.md)

---

## 📂 เกมในโปรเจกต์

| เกม | สถานะ | Stack | รายละเอียด |
|---|---|---|---|
| 🧩 **Sudoku Daily** ([`sudoku/`](./sudoku)) | 🟡 Active dev (v0.0.0) | TypeScript + Vite + PWA + Capacitor + Supabase | Daily puzzle, leaderboard, streak, auth, Android/iOS apps |
| 🎯 **Match Three** ([`match-three/`](./match-three)) | ✅ Playable | Vanilla JS + localStorage | จับคู่ 3 แบบคลาสสิก, 8×8, combo chain |
| 🏀 **Suika / Ball Merge** ([`suika/`](./suika)) | ✅ Playable | Vanilla JS + custom physics | ปล่อยลูกชนรวมร่าง 11 ระดับ |
| 🔢 **2048** ([`2048/`](./2048)) | ✅ Playable | Vanilla JS + localStorage | Slide tiles, merge pairs, reach 2048 |

---

## 🧩 Sudoku Daily — เกมหลัก (active development)

แอป Sudoku แนว daily puzzle เต็มรูปแบบ — ปริศนาใหม่ทุกวัน + leaderboard + auth + streak + achievements

### ✨ Highlights
- 🌐 **PWA** — ติดตั้งเป็นแอปจาก browser, ใช้ offline ได้
- 📱 **Mobile apps** — Android APK + iOS (.app) ผ่าน Capacitor 8
- 🔐 **Auth** — Anonymous → Email/Password upgrade (Supabase Auth)
- 🧠 **Engine** — Sudoku generator + solver พร้อม uniqueness check (เขียนเองตั้งแต่ 0)
- ☁️ **Backend** — Supabase Postgres + 7 migrations + 2 edge functions + pg_cron
- 🛡️ **Anti-cheat** — edge function `submit-daily-score` ตรวจสอบ server-side
- 📊 **Analytics + Sentry** — integration พร้อม (no-op safe ถ้าไม่ตั้ง env)
- 🎨 **Custom branding** — animated splash, adaptive icons + monochrome (Android 13+)
- ✅ **Quality** — 37/37 unit tests, TypeScript strict, ESLint + Prettier, build ~65 KB gzip

### 📦 Architecture
```
sudoku/
├── src/
│   ├── engine/        ← pure logic (generator, solver, validator, scoring, quests, rng)
│   ├── lib/           ← supabase, auth, api, analytics, migrate-v1, local-db, format
│   ├── ui/            ← views (game, home, splash, leaderboard, auth-modal), board, numpad
│   └── main.ts        ← routing + boot flow
├── supabase/
│   ├── migrations/    ← 7 SQL migrations (init, RLS, triggers, views, RPC, security, cron)
│   └── functions/     ← submit-daily-score, generate-daily-puzzle
├── android/ · ios/    ← Capacitor native projects
├── tests/             ← vitest (37 tests)
└── docs/              ← 40 markdown files ใน 7 sections
```

### 🚀 รัน Sudoku Daily

```bash
cd sudoku
npm install
cp .env.example .env.local   # เติม Supabase URL + anon key (ดู docs)
npm run dev                  # http://localhost:5173
```

Build + verify:
```bash
npm run build
npm test                     # 37 tests
npm run phase0:verify        # self-check ทั้งโปรเจกต์
```

### 📲 Mobile builds

```bash
# Android
npm run build && npx cap sync android && npx cap open android

# iOS (macOS only)
npm run build && npx cap sync ios && npx cap open ios
```

📄 **เอกสารเชิงลึก:** [`sudoku/docs/README.md`](./sudoku/docs/README.md)

---

## 🎯 Match Three (`match-three/`)

เกมจับคู่ 3 แบบคลาสสิก (Bejeweled / Candy Crush-style) — Vanilla JS เล่นในไฟล์ได้เลย

- กระดาน **8×8** มี 6 สัญลักษณ์ (🍎🍇🍋🍒🍊💎)
- จับคู่ ≥3 แนวตั้ง/แนวนอน → ระเบิด + ของใหม่ตกลงมา
- **Combo chain:** chain ต่อเนื่อง × ทวีคูณคะแนน
- Timer 3 / 5 / 10 นาที, ระบบ user + leaderboard ใน localStorage (`mt_db_v1`)

**รัน:** เปิด `match-three/index.html` ใน browser ได้เลย

---

## 🔢 2048 (`2048/`)

Classic 2048 — slide and combine like-numbered tiles to reach 2048 (or beyond)

- 4×4 board, swipe on mobile / arrow keys (or WASD / HJKL) on desktop
- **Undo** (1 step) and persistent saved board across sessions
- 11+ tile tiers with custom palettes (2 → 4 → 8 → ... → 4096 → 8192)
- Multi-user login + global leaderboard (`g2048_db_v1`)
- Stats: total games, total score, high score, highest tile, play time

**รัน:** เปิด `2048/index.html` ใน browser ได้เลย

---

## 🏀 Suika / Ball Merge (`suika/`)

ปล่อยลูกบอลลงมา ชนชนิดเดียวกัน → รวมร่างเป็นลูกถัดไป — Vanilla JS + custom physics (ไม่ใช้ engine)

- 11 ระดับ: 🏓 → 🎱 → 🥎 → ⚾ → 🎾 → 🏐 → ⚽ → 🏀 → 🌕 → 🪩 → 🌎
- Gravity `0.4`, friction `0.99`, bounce `0.3`, collision O(n²)
- ลูกค้างเหนือเส้น danger นานเกินไป → จบเกม
- ระบบ user + stats ใน localStorage (`suika_db_v1`)

**รัน:** เปิด `suika/index.html` ใน browser ได้เลย

---

## 🗂 โครงสร้างโปรเจกต์

```
mini-games/
├── README.md            ← (ไฟล์นี้)
├── PROGRESS.md          ← ความคืบหน้าแต่ละ phase
├── TASK.md              ← subtask ย่อยพร้อม priority
├── CHANGELOG.md         ← release history
├── releases/            ← release notes per version
├── sudoku/              ← 🧩 Sudoku Daily (TS + Vite + PWA + mobile)
├── match-three/         ← 🎯 Match Three (Vanilla JS)
├── suika/               ← 🏀 Ball Merge (Vanilla JS)
├── 2048/                ← 🔢 2048 (Vanilla JS)
├── legal/               ← 📜 Privacy + Terms
└── landing/             ← 🌐 Marketing landing page
```

---

## 🛣️ Roadmap (Sudoku Daily)

| Phase | สถานะ | สรุป |
|---|---|---|
| **Phase 0** Foundation | ✅ 100% | Engine + infra + mobile wrap (released v0.0.0) |
| **Phase 1** MVP | 🟡 ~30% | Daily puzzle + Leaderboard + Auth + Streak — soft launch |
| **Phase 2** Customization | ⏳ 0% | Coin economy, shop, themes, avatar |
| **Phase 3** Progression | ⏳ 0% | XP/level, 50+ achievements, stats dashboard |
| **Phase 4** Polish & Launch | 🟡 30% | Play Store + App Store submission |
| **Phase 5** Monetization | ⏳ 0% | Subscription, ads, IAP |

ดูรายละเอียดและ subtask ที่ [TASK.md](./TASK.md)

---

## 🔗 Quick Links

| Resource | URL |
|---|---|
| GitHub Repo | https://github.com/SirisakUnknowss/mini-games |
| Latest Release | https://github.com/SirisakUnknowss/mini-games/releases/tag/v0.0.0 |
| Sudoku docs | [sudoku/docs/README.md](./sudoku/docs/README.md) |
| Vision | [sudoku/docs/00-overview/vision.md](./sudoku/docs/00-overview/vision.md) |
| Roadmap | [sudoku/docs/00-overview/roadmap.md](./sudoku/docs/00-overview/roadmap.md) |
| Dev onboarding | [sudoku/docs/06-implementation/developer-onboarding.md](./sudoku/docs/06-implementation/developer-onboarding.md) |

---

## 📝 Notes

- เกม Match Three และ Suika ยังเก็บข้อมูลใน localStorage (ไม่ใช่ production-grade auth) — แยก account คนละเกม
- Sudoku Daily ย้ายไป Supabase Auth + Postgres เต็มรูปแบบแล้ว
- เกมเก่า (vanilla JS) ยังไม่มีแผนพัฒนาต่อ — focus หลักอยู่ที่ Sudoku Daily
