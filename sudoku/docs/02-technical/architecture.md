# 🏗️ System Architecture

## High-level Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    Client (PWA / Mobile)                      │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   UI Layer   │  │ Game Engine  │  │  Offline Sync Queue │ │
│  │  (HTML/CSS)  │  │ (pure logic) │  │  (IndexedDB)        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘ │
│         │                  │                     │             │
│  ┌──────┴──────────────────┴─────────────────────┴──────────┐│
│  │              Supabase Client SDK                         ││
│  └──────────────────────────┬───────────────────────────────┘│
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTPS / WSS
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                       Supabase Cloud                          │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Auth        │  │  Postgres DB │  │  Edge Functions     │ │
│  │  (JWT)       │  │  + RLS       │  │  (Deno)             │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  Realtime    │  │  Storage     │  │  Cron (pg_cron)     │ │
│  │  (websocket) │  │  (assets)    │  │  (daily puzzle gen) │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│            External Services (optional)                       │
│  • PostHog (analytics)                                        │
│  • Sentry (error tracking)                                    │
│  • FCM (push notifications)                                   │
│  • Cloudflare (CDN + DDoS)                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components

### Client

#### 1. UI Layer
- **Tech:** HTML + CSS + Vanilla JS (สำหรับ MVP, อาจ migrate React ภายหลัง)
- **Responsibility:** Rendering, user interaction, animation
- **No business logic** — call Game Engine instead

#### 2. Game Engine
- **File:** `engine/sudoku.js`, `engine/scoring.js`, `engine/validator.js`
- **Pure logic** — no DOM, no globals
- **Testable** — unit tests with Jest/Vitest

#### 3. Offline Sync Queue
- **Tech:** IndexedDB ผ่าน `idb` library
- **Responsibility:** Queue actions ตอน offline → sync เมื่อ online
- **Strategy:** Last-write-wins สำหรับ user state, append-only สำหรับ events

#### 4. Supabase Client
- **SDK:** `@supabase/supabase-js`
- **Wrapping:** สร้าง `lib/api.ts` ห่อ Supabase ไว้
- **Auth:** JWT auto-refresh

### Server (Supabase)

#### 1. Auth
- Email + password
- Google OAuth
- Anonymous user (auto-create UUID, link to email later)

#### 2. Postgres DB
- ดู [database-schema.md](./database-schema.md)
- Row Level Security (RLS) ทุก table

#### 3. Edge Functions (Deno)
- `submit-daily-score` — anti-cheat validation
- `claim-quest-reward` — verify quest complete
- `purchase-item` — verify shop transaction
- `generate-daily-puzzle` — pre-gen 30 days (cron)
- `compute-leaderboard-rewards` — daily ranking rewards
- `check-streak-freeze` — daily streak reset job

#### 4. Realtime
- Channels: `daily-leaderboard:${date}`
- ใช้สำหรับ live update ของ leaderboard

#### 5. Storage
- Avatar SVG sprites
- Background images
- Theme presets (JSON)

#### 6. Cron (pg_cron extension)
- **23:00 UTC** — generate daily puzzle 30 days ahead
- **00:01 UTC** — process streak (reset/freeze)
- **00:05 UTC** — daily leaderboard reward distribution
- **Every 5 min** — health check

---

## 🔄 Key Data Flows

### Flow 1: Play Daily Puzzle

```
1. User opens app
   → Client: fetch /api/daily-puzzle/today
   → Server: SELECT * FROM daily_puzzles WHERE date = today
   → Return puzzle + solution_hash (not solution!)

2. User plays
   → Client: Track moves in memory
   → Engine: Validate locally for instant feedback
   → IndexedDB: Save game state every 10 seconds (resume)

3. User wins
   → Client: POST /api/submit-daily-score
     { date, time, mistakes, hints, moves[] }
   → Edge Function:
     - Fetch puzzle
     - Replay moves → verify final = solution
     - Sanity check (time, mistakes range)
     - Compute score server-side
     - Insert daily_leaderboard
     - Grant coins (transaction)
     - Update streak
     - Check achievements
   → Return { score, rank, rewards }

4. Client shows win modal + leaderboard
```

### Flow 2: Quest Progress

```
1. User starts game
   → Client: Get today's quests from server
   → Cache in memory

2. User makes move
   → Engine: Detect "quest-relevant event"
   → e.g. game complete, no-hint, fast finish
   → Client: increment quest progress (optimistic)

3. After game complete
   → Client: POST /api/update-quest-progress
     { date, events[] }
   → Server: Validate events, update DB
   → If quest complete → mark claimable

4. User clicks "claim"
   → Client: POST /api/claim-quest
   → Server: Grant coins + XP atomically
```

### Flow 3: Shop Purchase

```
1. User opens shop
   → Client: Fetch shop catalog + user inventory
   → Render available items

2. User clicks "buy"
   → Client: POST /api/purchase-item { item_id }
   → Edge Function:
     - Check user has item already? reject if yes
     - Check user balance >= price
     - Transaction:
       * DEDUCT coins from wallet
       * INSERT inventory record
       * INSERT transaction log
   → Return { success, new_balance }

3. Client updates UI
```

### Flow 4: Offline Sync

```
1. User offline → plays games
   → Client: queue actions in IndexedDB
     { id, action, payload, created_at }

2. Network back online
   → Client: detect via 'online' event
   → Drain queue in order:
     - For each action → POST to server
     - On success → remove from queue
     - On fail (e.g., already submitted) → log, drop

3. Conflict resolution:
   - Score: server takes max
   - Quest progress: client value treated as input, server computes
   - Settings: last-write-wins
```

---

## 🔐 Security

### Authentication
- JWT issued by Supabase Auth
- 1-hour expiry, auto-refresh
- HttpOnly cookie ไม่ใช่ (PWA limit) — store in localStorage แต่ encrypt at rest? ไม่จำเป็น

### Authorization
- RLS policy บนทุก table
- User เห็น/แก้ได้แค่ row ของตัวเอง
- Public read บน: `daily_puzzles`, `shop_items`, `achievements_definitions`

### Anti-cheat
- ทุก score/quest/purchase ผ่าน Edge Function
- Client ส่ง move log → server replay → verify
- Sanity check time/mistakes range
- Audit trail ทุก transaction

ดู [anti-cheat.md](./anti-cheat.md) สำหรับ detail

---

## ⚡ Performance

### Targets
- **First Contentful Paint:** < 1.5s on 3G
- **Time to Interactive:** < 3s
- **Daily puzzle load:** < 500ms
- **Submit score response:** < 1s p95

### Strategy
- **Code split** by route (login, menu, game, shop)
- **Lazy load** avatar SVGs
- **Service worker** cache static assets
- **Preload** daily puzzle on app open
- **Realtime channel** subscribe เฉพาะตอนดู leaderboard

### Bundle Size Budget
| Asset | Max |
|---|---|
| Initial JS | 100KB gzipped |
| Initial CSS | 30KB gzipped |
| Avatar sprite atlas | 200KB lazy |
| Background photos | 200KB each, lazy |

---

## 📦 Project Structure

```
sudoku/
├── public/                  # static assets
│   ├── avatar/             # SVG sprites
│   ├── bg/                  # background images
│   └── icons/               # PWA icons
├── src/
│   ├── engine/              # pure game logic
│   │   ├── sudoku.ts
│   │   ├── solver.ts
│   │   ├── generator.ts
│   │   ├── scoring.ts
│   │   └── validator.ts
│   ├── lib/
│   │   ├── api.ts           # Supabase wrapper
│   │   ├── auth.ts
│   │   ├── db.ts            # IndexedDB
│   │   └── sync.ts          # offline sync
│   ├── ui/
│   │   ├── views/           # screens
│   │   ├── components/      # reusable
│   │   └── styles/          # CSS + themes
│   ├── state/               # state management
│   └── main.ts              # entry
├── supabase/
│   ├── migrations/          # SQL
│   ├── functions/           # Edge functions
│   └── seed.sql
├── capacitor/                # mobile wrapper
├── tests/
├── docs/                     # ← you are here
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Tech Choices Summary

| Layer | Tech | Why |
|---|---|---|
| Build | Vite | Fast dev, ESM, small bundle |
| Lang | TypeScript | Type safety |
| Frontend | Vanilla TS (MVP) → maybe React later | Code v1 works, save time |
| Style | CSS Variables + light SCSS | Theme swap easy |
| State | Zustand (lightweight) | Avoid Redux overhead |
| BaaS | Supabase | Postgres + Auth + Realtime + Functions all-in-one |
| DB | Postgres (Supabase) | Powerful, RLS, JSON support |
| Offline | IndexedDB (idb) | Standard, 50MB+ |
| Test | Vitest | Vite-native, fast |
| Mobile | Capacitor | Web → iOS/Android |
| Analytics | PostHog (self-host or cloud) | Privacy-respecting, full feature |
| Errors | Sentry | Industry standard |
| Push | FCM | Free, Google + iOS |
| CDN | Cloudflare | Free tier, fast |
