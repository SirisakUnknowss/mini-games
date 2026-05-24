# 🧩 Sudoku Daily — Documentation Hub

> เอกสารกลางสำหรับโปรเจ็กต์ Sudoku Daily — เกม Sudoku แบบ retention-focused พร้อม daily quest, leaderboard, และ customization

**สถานะปัจจุบัน:** Pre-MVP — มี v1 (single-player, localStorage) แล้ว กำลัง pivot ไปเป็น online + daily mode
**Owner:** sirisak.unknowss@gmail.com
**เริ่มเขียน docs:** 2026-05-23

---

## 🎯 Vision สรุปสั้น

> "Sudoku ที่ทำให้คนกลับมาเล่นทุกวัน ด้วย daily puzzle + leaderboard + customization — **โดยไม่เน้นรายได้ในช่วงแรก** เน้น DAU/retention ก่อน"

อ่านเต็มที่ → [`00-overview/vision.md`](./00-overview/vision.md)

---

## 📁 โครงสร้างเอกสาร

```
docs/
├── 00-overview/         ← วิสัยทัศน์, roadmap, glossary
├── 01-game-design/      ← spec ของ gameplay ทุกระบบ
├── 02-technical/        ← architecture, schema, API, generator
├── 03-ui-ux/            ← screens, design system, flow
├── 04-current-state/    ← code audit ของ v1, refactor plan
├── 05-infrastructure/   ← Supabase, CI/CD, monitoring, cost
└── 06-implementation/   ← task breakdown ของแต่ละ phase
```

---

## 🚀 Quick Start สำหรับ Dev/AI ที่มาใหม่

ถ้าคุณเพิ่งมา **อ่านตามลำดับนี้**:

1. [`00-overview/vision.md`](./00-overview/vision.md) — เข้าใจว่าทำอะไรเพื่อใคร
2. [`00-overview/roadmap.md`](./00-overview/roadmap.md) — phase ไหน, อะไรก่อนหลัง
3. [`02-technical/architecture.md`](./02-technical/architecture.md) — ภาพรวมระบบ
4. [`02-technical/tech-stack.md`](./02-technical/tech-stack.md) — ใช้อะไร ทำไม
5. [`04-current-state/code-audit.md`](./04-current-state/code-audit.md) — code ปัจจุบันเป็นยังไง
6. [`06-implementation/developer-onboarding.md`](./06-implementation/developer-onboarding.md) — ลงมือทำงาน

---

## 📚 Index รายไฟล์

### 00 — Overview
| ไฟล์ | เนื้อหา |
|---|---|
| [vision.md](./00-overview/vision.md) | Positioning, target users, success metrics |
| [roadmap.md](./00-overview/roadmap.md) | Phases, timeline, milestones |
| [glossary.md](./00-overview/glossary.md) | คำศัพท์ที่ใช้ในโปรเจ็กต์ |

### 01 — Game Design
| ไฟล์ | เนื้อหา |
|---|---|
| [core-loop.md](./01-game-design/core-loop.md) | Gameplay loop หลัก |
| [daily-puzzle.md](./01-game-design/daily-puzzle.md) | กฎ daily puzzle, generation, difficulty |
| [daily-quest.md](./01-game-design/daily-quest.md) | Quest types, generation, rewards |
| [leaderboard.md](./01-game-design/leaderboard.md) | Scoring formula, rules, anti-cheat |
| [achievements.md](./01-game-design/achievements.md) | Achievement catalog 50+ อัน |
| [progression.md](./01-game-design/progression.md) | XP, level, streak, freeze |
| [coin-economy.md](./01-game-design/coin-economy.md) | Coin sources/sinks, balance numbers |
| [customization.md](./01-game-design/customization.md) | Themes, backgrounds, avatars catalog |

### 02 — Technical
| ไฟล์ | เนื้อหา |
|---|---|
| [architecture.md](./02-technical/architecture.md) | System architecture diagram + components |
| [tech-stack.md](./02-technical/tech-stack.md) | ทุก library/service + rationale |
| [database-schema.md](./02-technical/database-schema.md) | Supabase tables + RLS + indexes |
| [api-spec.md](./02-technical/api-spec.md) | RPC functions + REST endpoints |
| [puzzle-generator.md](./02-technical/puzzle-generator.md) | Daily puzzle algo + uniqueness check |
| [auth.md](./02-technical/auth.md) | Auth flow (email + OAuth + anonymous) |
| [offline-sync.md](./02-technical/offline-sync.md) | Offline-first strategy |
| [anti-cheat.md](./02-technical/anti-cheat.md) | Server validation, sanity checks |
| [deployment.md](./02-technical/deployment.md) | PWA, Capacitor, store submission |

### 03 — UI/UX
| ไฟล์ | เนื้อหา |
|---|---|
| [screens.md](./03-ui-ux/screens.md) | List ทุก screen + states |
| [design-system.md](./03-ui-ux/design-system.md) | Color, typography, spacing tokens |
| [shop-design.md](./03-ui-ux/shop-design.md) | Shop UX detail |
| [user-flows.md](./03-ui-ux/user-flows.md) | Key user journeys |

### 04 — Current State
| ไฟล์ | เนื้อหา |
|---|---|
| [code-audit.md](./04-current-state/code-audit.md) | Review ของ code v1 |
| [refactor-plan.md](./04-current-state/refactor-plan.md) | Step-by-step refactor |
| [migration-notes.md](./04-current-state/migration-notes.md) | localStorage → Supabase migration |

### 05 — Infrastructure
| ไฟล์ | เนื้อหา |
|---|---|
| [supabase-setup.md](./05-infrastructure/supabase-setup.md) | Project setup, schema, RLS |
| [github-actions.md](./05-infrastructure/github-actions.md) | CI/CD pipelines |
| [monitoring.md](./05-infrastructure/monitoring.md) | Analytics + error tracking |
| [environments.md](./05-infrastructure/environments.md) | dev/staging/prod config |
| [costs.md](./05-infrastructure/costs.md) | Monthly cost projection |

### 06 — Implementation
| ไฟล์ | เนื้อหา |
|---|---|
| [phase-1-mvp.md](./06-implementation/phase-1-mvp.md) | MVP task breakdown |
| [phase-2-customization.md](./06-implementation/phase-2-customization.md) | Themes, avatar, shop tasks |
| [phase-3-progression.md](./06-implementation/phase-3-progression.md) | Achievement, XP tasks |
| [developer-onboarding.md](./06-implementation/developer-onboarding.md) | First-day setup guide |

---

## 🔑 Decisions Log

ทุก decision สำคัญต้อง log ที่นี่พร้อมเหตุผล:

| Date | Decision | Reason |
|---|---|---|
| 2026-05-23 | ใช้ Supabase แทน Firebase | Postgres + RLS + ราคาถูกกว่า + portable |
| 2026-05-23 | Vanilla JS ก่อน, ไม่ migrate ไป React ใน MVP | Code v1 ใช้ได้, focus ที่ feature ก่อน |
| 2026-05-23 | Daily puzzle = ทุกคนได้ puzzle เดียวกันทั้งโลก | Viral mechanic แบบ Wordle |
| 2026-05-23 | ไม่ทำ monetization ใน phase 1-3 | Focus DAU ก่อน เงินค่อยว่ากัน |

---

## 📝 Convention

- ภาษาไทยปนอังกฤษได้ — keyword technical ใช้อังกฤษ
- ทุกไฟล์ markdown มีหัว `# Title` + intro 1-2 บรรทัด
- Code block ใช้ language tag เสมอ (` ```ts `, ` ```sql `)
- เลขเงิน/จำนวน — เขียนเป็น token ที่ปรับได้ใน `coin-economy.md` ห้าม hardcode กระจาย
