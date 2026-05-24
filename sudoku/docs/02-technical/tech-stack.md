# 🛠️ Tech Stack

> รายละเอียดทุก library/service + เหตุผลที่เลือก + alternatives ที่พิจารณา

## 📦 Frontend

### Build Tool: **Vite**
- **Version:** ^5.0
- **Why:** Fast HMR, ESM-native, small config, plugin ecosystem
- **Alt considered:** Webpack (overkill), Parcel (less popular), esbuild raw (no HMR)

### Language: **TypeScript**
- **Version:** ^5.3
- **Why:** Type safety สำคัญตอนระบบเริ่มใหญ่ (state, API responses, game engine)
- **Strict mode:** ON
- **Migrate strategy:** ค่อยๆ migrate code v1 ทีละไฟล์, ใช้ `.ts` ตั้งแต่ใหม่

### Framework: **None (Vanilla TS) → React (post-MVP)**
- **MVP:** Vanilla TS — code v1 ใช้ได้, save time
- **Post-MVP:** อาจ migrate React ถ้า UI ซับซ้อนขึ้น
- **Alt considered:**
  - React — เร็วสำหรับทีม แต่ MVP overkill
  - Svelte — bundle เล็ก แต่ ecosystem เล็ก
  - SolidJS — performance ดี แต่ niche

### Styling: **CSS Variables + Light SCSS**
- **Why:** Theme system ต้องใช้ CSS var → swap dynamic
- **Alt:** Tailwind (รก HTML), CSS-in-JS (overhead), Vanilla CSS (ก็ได้)

### State: **Zustand**
- **Version:** ^4.5
- **Why:** Lightweight (~1KB), no boilerplate, works with vanilla TS
- **Alt:** Redux (overkill), Jotai (atomic but more complex), MobX (too opinionated)

### Routing
- **MVP:** Manual `show(viewId)` แบบ v1
- **Post-MVP:** `wouter` (lightweight, 1.2KB) หรือ React Router

---

## 🗄️ Backend / BaaS

### Supabase (Main Choice)
- **Plan:** Free tier (500MB DB, 50k MAU) → Pro $25/เดือน เมื่อโต
- **Includes:**
  - Postgres (with extensions: `pg_cron`, `pgcrypto`, `uuid-ossp`)
  - Auth (email, OAuth, magic link, anonymous)
  - Realtime (Postgres CDC over WebSocket)
  - Storage (S3-like)
  - Edge Functions (Deno runtime)
- **Why:**
  - Postgres > Firestore สำหรับ relational data
  - RLS = built-in security
  - Self-hostable (escape hatch)
  - Pricing ชัดเจน, ถูกกว่า Firebase
- **Alt considered:**
  - Firebase — Firestore แพง, no SQL
  - PocketBase — เล็ก, self-host แต่ scale ลำบาก
  - Custom Node.js — ทำเองหมด ใช้เวลามาก
  - Cloudflare D1 + Workers — น่าสนใจแต่ Sudoku.com use case ไม่ต้องการ edge ขนาดนั้น

### Database: **Postgres 15+** (via Supabase)

**Extensions:**
- `pg_cron` — schedule daily jobs
- `pgcrypto` — UUID generation, hashing
- `uuid-ossp` — UUID utilities

### Edge Functions: **Deno** (Supabase Functions)
- TypeScript native
- Fast cold start
- Sandboxed

---

## 📱 Mobile

### Capacitor
- **Version:** ^6.0
- **Why:** Wrap PWA → native iOS/Android, ไม่ต้องเขียนใหม่
- **Plugins:**
  - `@capacitor/push-notifications`
  - `@capacitor/haptics`
  - `@capacitor/preferences` (native storage)
  - `@capacitor/share`
  - `@capacitor/network`
- **Alt:** Cordova (เก่า), React Native (เขียนใหม่หมด), Flutter (เขียนใหม่หมด)

---

## 🌐 PWA

### Service Worker
- **Lib:** Workbox 7
- **Why:** Workbox > raw SW, recipes พร้อมใช้
- **Strategy:**
  - Static assets: cache-first
  - API GET: stale-while-revalidate
  - API POST: network-only + queue offline

### Manifest
- File: `public/manifest.json`
- Icons: 192px, 512px, 192px maskable, 512px maskable
- Theme color: `#667eea`

---

## 🧪 Testing

### Unit/Integration: **Vitest**
- **Version:** ^1.0
- **Why:** Vite-native, fast, Jest-compatible API
- **Coverage target:** 80% สำหรับ `engine/`, `lib/`

### E2E: **Playwright**
- **When:** Phase 4+
- **Critical paths:** login, daily puzzle, leaderboard submit

---

## 📊 Observability

### Analytics: **PostHog**
- **Tier:** Free (1M events/เดือน)
- **Why:** Product analytics > Google Analytics, self-hostable
- **Events to track:**
  - `app_open`, `daily_puzzle_start`, `daily_puzzle_complete`
  - `quest_complete`, `level_up`, `achievement_unlock`
  - `shop_view`, `item_purchase`
  - `streak_lost`, `streak_milestone`
- **Funnels:**
  - Sign up → first daily complete → 7-day streak
  - First shop view → first purchase
- **Alt:** Mixpanel (แพง), Amplitude (free tier เล็ก), GA4 (privacy + UX แย่)

### Error Tracking: **Sentry**
- **Tier:** Free (5k errors/เดือน)
- **Setup:** SDK in client + Edge Functions
- **Alt:** LogRocket (มี session replay แต่แพง), self-host (effort)

### Logging (Server)
- Supabase built-in logs
- Edge Function `console.log` → Supabase Logs UI

---

## 🚀 Deployment

### Web Hosting
- **Choice:** Cloudflare Pages (free tier เพียงพอ)
- **Auto-deploy:** GitHub Actions on push to `main`
- **Preview:** Every PR ได้ preview URL

### Mobile
- **iOS:** App Store Connect via Xcode + Capacitor
- **Android:** Play Console via Android Studio + Capacitor

### CDN
- **Cloudflare** (web + assets)

---

## 🔔 Push Notifications

### **Firebase Cloud Messaging (FCM)**
- **Tier:** Free unlimited
- **Why:** Standard, works Android + Web Push + iOS
- **Use cases:**
  - Daily puzzle ready (เวลา local)
  - Streak warning (เหลือ 2 ชม. ก่อนพลาด)
  - Achievement unlock
  - Leaderboard rank notice (เข้า top 100)

---

## 💵 Cost Projection (Monthly)

ดู [`05-infrastructure/costs.md`](../05-infrastructure/costs.md) สำหรับ detail

| Service | Free tier | Cost at 5k DAU | Cost at 50k DAU |
|---|---|---|---|
| Supabase | $0 | $25 | $599 |
| Cloudflare Pages | $0 | $0 | $0 |
| PostHog | $0 | $0 | $0-$50 |
| Sentry | $0 | $0 | $26 |
| FCM | $0 | $0 | $0 |
| Domain | - | $12/yr | $12/yr |
| **Total** | **$0** | **~$25/mo** | **~$700/mo** |

---

## 📋 Package.json (Template)

```json
{
  "name": "sudoku-daily",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src",
    "supabase:start": "supabase start",
    "supabase:reset": "supabase db reset",
    "supabase:gen-types": "supabase gen types typescript --local > src/lib/database.types.ts",
    "cap:sync": "npx cap sync",
    "cap:ios": "npx cap open ios",
    "cap:android": "npx cap open android"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@capacitor/core": "^6.0.0",
    "@capacitor/ios": "^6.0.0",
    "@capacitor/android": "^6.0.0",
    "@capacitor/push-notifications": "^6.0.0",
    "@capacitor/haptics": "^6.0.0",
    "@capacitor/share": "^6.0.0",
    "@capacitor/network": "^6.0.0",
    "idb": "^8.0.0",
    "workbox-window": "^7.0.0",
    "zustand": "^4.5.0",
    "posthog-js": "^1.96.0",
    "@sentry/browser": "^7.99.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@playwright/test": "^1.40.0",
    "eslint": "^8.55.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "prettier": "^3.1.0",
    "supabase": "^1.110.0",
    "sass": "^1.69.0",
    "workbox-build": "^7.0.0"
  }
}
```
