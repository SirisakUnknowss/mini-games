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
- `TASK.md` — subtask breakdown ย่อย ๆ ทุก phase พร้อม priority + status + ประมาณเวลา

#### Changed
- `README.md` — ปรับเป็น hub ของทั้ง 3 เกม, ชู Sudoku Daily เป็นเกมหลัก, เพิ่ม roadmap table + คำสั่งรัน web/Android/iOS

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
