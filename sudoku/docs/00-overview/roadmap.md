# 🗺️ Roadmap

> Phased plan — ไม่ทำหลายอย่างพร้อมกัน, ปล่อย phase 1 ก่อนค่อยทำ phase ต่อไป

## 📊 ภาพรวม Phase

| Phase | ระยะเวลา | เป้า | สถานะ |
|---|---|---|---|
| **Phase 0** — Foundation | 2 สัปดาห์ | Setup infra, refactor code v1 | ✅ **DONE** |
| **Phase 1** — MVP (Daily + Leaderboard) | 6 สัปดาห์ | Soft launch | 🔜 |
| **Phase 2** — Customization | 4 สัปดาห์ | Themes + Avatar + Shop | ⏳ |
| **Phase 3** — Progression | 3 สัปดาห์ | Achievement + XP | ⏳ |
| **Phase 4** — Polish & Launch | 3 สัปดาห์ | PWA, app stores | ⏳ |
| **Phase 5+** — Monetization & Scale | TBD | Sub + ads | ⏳ |

**Total to v1.0 launch:** ~4-5 เดือน (full-time) หรือ ~7-8 เดือน (part-time)

---

## Phase 0 — Foundation (สัปดาห์ 1-2) ✅ DONE

**Goal:** เตรียมพื้นฐานให้ทุก phase ต่อไปสร้างต่อได้

### Tasks
- [x] เขียน database schema (ดู `02-technical/database-schema.md`) — 4 migration files
- [x] ทำ migration scripts — `supabase/migrations/*.sql`
- [x] Setup GitHub repository structure (monorepo: web + supabase + capacitor)
- [x] Setup CI/CD พื้นฐาน — 3 workflows (ci, deploy-web, deploy-supabase)
- [x] Refactor code v1: แยก `engine/` (pure logic) ออกจาก `ui/` — TypeScript, 37 tests
- [x] Migration: localStorage → Supabase (sync layer) — `src/lib/migrate-v1.ts`
- [x] Setup analytics (PostHog) + error tracking (Sentry) — `src/lib/analytics.ts`
- [x] **Bonus** Capacitor wrap + APK + iOS app built early (Phase 4 prep)

### Setup Supabase (one-time, per environment)
- **Local:** `supabase start` (ต้องการ Docker + ~3 GB disk)
- **Cloud:** สร้าง project ที่ supabase.com, `supabase link --project-ref <id>`, `supabase db push`

> ⚠️ ใน macOS ที่ disk เหลือน้อย (< 10GB) Docker pull อาจ fail — ใช้ Supabase Cloud แทน

**Exit criteria:** ✅ ผ่านทั้งหมด
- Code structure: pure engine + lib + ui แยกชั้นชัดเจน
- Tests: 37/37 passed
- Build: production bundle 65KB gzip
- Mobile: APK + iOS app builds successfully
- Analytics + Error tracking: hooks ready (no-op if env keys missing)
- v1 migration: idempotent, runs on boot if v1 data detected
- Verification script: `npm run phase0:verify`

---

## Phase 1 — MVP (สัปดาห์ 3-8)

**Goal:** มี daily puzzle + leaderboard + daily quest ทำงานครบ → soft launch

### Week 3-4: Daily Puzzle System
- [ ] Puzzle generator + uniqueness check (ดู `02-technical/puzzle-generator.md`)
- [ ] Cron job: generate daily puzzle วันละ 1 อัน, store ใน DB
- [ ] Difficulty rotation: จันทร์ง่าย → อาทิตย์ยาก (NYT-style)
- [ ] UI screen: "Daily Puzzle" tab + countdown to next day

### Week 5-6: Leaderboard + Auth
- [ ] Supabase Auth — email + Google OAuth + anonymous
- [ ] User profile (display name, country, avatar emoji default)
- [ ] Daily leaderboard table + realtime updates
- [ ] Leaderboard UI: Top 100 ของวันนี้ + ตำแหน่งของเรา
- [ ] History 7 วันย้อนหลัง
- [ ] Anti-cheat: server-side score validation

### Week 7: Daily Quest + Streak
- [ ] Daily quest generator (3 quest/วัน, สุ่มจาก pool)
- [ ] Quest tracking system
- [ ] Streak counter + visual

### Week 8: Polish + Soft Launch
- [ ] Onboarding flow (first-time user)
- [ ] Push notification (web push API)
- [ ] Bug fix + load test
- [ ] Soft launch ในไทยผ่าน PWA + share link

**Exit criteria:**
- มี user สมัครจริง ≥ 500 คน
- DAU/MAU ratio ≥ 25%
- Daily puzzle completion rate ≥ 50%

---

## Phase 2 — Customization (สัปดาห์ 9-12)

**Goal:** เพิ่ม retention ด้วย collection/customization

### Week 9-10: Coin Economy + Shop
- [ ] Coin system (ดู `01-game-design/coin-economy.md`)
- [ ] Shop UI
- [ ] Inventory system
- [ ] Transaction log (audit trail)

### Week 11: Themes + Backgrounds
- [ ] Theme engine (CSS variable swap)
- [ ] 10 themes ออกแบบเสร็จ (Classic, Dark, Pastel, Neon, Sakura, Ocean, Forest, Sunset, Mono, Thai)
- [ ] 10 backgrounds (gradients + patterns + photos)
- [ ] Preview before buy

### Week 12: Avatar System
- [ ] Avatar base + slot system (head, eyes, hat, body, pet)
- [ ] 30+ items ออกแบบเสร็จ
- [ ] Avatar editor screen
- [ ] Show avatar ใน leaderboard

**Exit criteria:** > 60% ของ user ที่เล่นเกินวันที่ 3 ได้ซื้อของอย่างน้อย 1 ชิ้น

---

## Phase 3 — Progression (สัปดาห์ 13-15)

**Goal:** ผู้เล่นรู้สึก "พัฒนา" ในระยะยาว

### Week 13: XP + Level
- [ ] XP system (จากเล่น + quest + win + streak)
- [ ] Level up animation
- [ ] Unlock items by level

### Week 14: Achievements
- [ ] 50+ achievements (ดู `01-game-design/achievements.md`)
- [ ] Achievement screen
- [ ] Notification เมื่อปลดล็อก
- [ ] Reward: coins + special avatar items

### Week 15: Stats Deep Dive
- [ ] Personal stats dashboard เต็มรูปแบบ
- [ ] Compare to global average
- [ ] Weekly recap (email/push)

---

## Phase 4 — Polish & Launch (สัปดาห์ 16-18)

### Week 16: PWA + Mobile
- [ ] Service worker (offline-first)
- [ ] Web app manifest
- [ ] Install prompt
- [ ] Push notification (FCM)

### Week 17: Capacitor + Store Submission
- [ ] Wrap ด้วย Capacitor
- [ ] Test ใน iOS + Android
- [ ] Submit ขึ้น Play Store
- [ ] Submit ขึ้น App Store

### Week 18: Marketing Prep
- [ ] Landing page
- [ ] Press kit
- [ ] TikTok video assets
- [ ] Reddit/Twitter accounts

---

## Phase 5+ — Future (post v1.0)

**Backlog priority order:**
1. **Subscription** ($2.99/เดือน): no ads + premium themes + cloud sync
2. **Pencil marks / notes** (request ที่ user puzzle ขอเยอะ)
3. **Undo/Redo**
4. **Sudoku variants** (Killer, Samurai, Mini 6×6)
5. **Friends system** + private leaderboard
6. **Weekly tournament** (ใหญ่กว่า daily, รางวัลพิเศษ)
7. **Localization** (อังกฤษ → 10 ภาษา)
8. **Telegram Mini App version**
9. **Sponsored daily puzzle** (B2B revenue)

---

## 📅 Milestones สำคัญ

| Date Estimate | Milestone |
|---|---|
| Week 2 | Code refactored + Supabase live |
| Week 6 | Daily puzzle + leaderboard working |
| Week 8 | **🎉 Soft launch (ไทย)** |
| Week 12 | Customization complete |
| Week 15 | Achievement + XP complete |
| Week 18 | **🚀 v1.0 — Play Store + App Store launch** |
| Month 6 | DAU 5,000 target |
| Month 9 | Start monetization experiment |
| Month 12 | DAU 50,000 target |

---

## ⚠️ Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Supabase ราคาเกินทุน | มี free tier เยอะมาก, ถ้าเกินค่อย scale plan |
| ทำคนเดียวช้า | Phase 1 cut features หนัก, ออกไวกว่า |
| ไม่มีคนเล่น | Soft launch ไทย ใช้ network ส่วนตัวก่อน, paid promo ทีหลัง |
| Code v1 refactor ยาก | ถ้าเกิน 1 สัปดาห์ ตัดสินใจเขียนใหม่ |
| Capacitor มี bug บน iOS | Fallback เป็น PWA-only ก่อน |
