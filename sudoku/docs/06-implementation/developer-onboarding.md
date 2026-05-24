# 🧑‍💻 Developer Onboarding

> สำหรับ dev/AI ที่เข้ามาทำงานครั้งแรก — ทำ 60 นาทีให้ได้ environment ทำงาน

## 📋 Prerequisites

ติดตั้งก่อน:
- Node.js 20+
- npm 10+
- Git
- Docker Desktop (for Supabase local)
- Supabase CLI

```bash
# macOS
brew install node docker
brew install supabase/tap/supabase

# Linux
# follow respective installers
```

---

## 🚀 First-time Setup (60 minutes)

### Step 1: Clone Repo (5 min)

```bash
git clone <repo-url>
cd sudoku
npm install
```

### Step 2: Read Core Docs (15 min)

Read in order:
1. `docs/README.md` — overview
2. `docs/00-overview/vision.md` — what we're building
3. `docs/00-overview/roadmap.md` — current phase
4. `docs/02-technical/architecture.md` — system design

### Step 3: Start Supabase Locally (10 min)

```bash
supabase start
```

First time downloads ~1GB Docker images. Wait...

Once ready:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio: http://localhost:54323
anon key: eyJhbG...  ← copy this
service_role key: eyJhbG...
```

Save keys to `.env.local`:
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<paste anon key>
VITE_APP_ENV=local
```

### Step 4: Apply Migrations + Seed (5 min)

```bash
supabase db reset
```

This runs:
- All migrations in `supabase/migrations/`
- `supabase/seed.sql`

Verify in Studio: `http://localhost:54323` — should see tables

### Step 5: Start Dev Server (2 min)

```bash
npm run dev
```

Open `http://localhost:5173`

### Step 6: Sanity Test (5 min)

- [ ] App loads
- [ ] Anonymous sign-in works (check Studio → auth.users)
- [ ] Can play a practice game
- [ ] Score saved to DB

### Step 7: Run Tests (5 min)

```bash
npm run test
```

Should pass all engine tests.

### Step 8: Familiarize with Layout (10 min)

```
src/
├── engine/           ← pure game logic (HERE for puzzle/scoring bugs)
├── lib/api.ts        ← all Supabase calls (HERE for API changes)
├── ui/views/         ← screens (HERE for UI changes)
├── ui/components/    ← reusable components
├── state/            ← global state
└── main.ts           ← entry

supabase/
├── migrations/       ← DB schema (HERE for schema changes)
├── functions/        ← Edge Functions (HERE for server logic)
└── seed.sql          ← seed data
```

---

## 🛠️ Common Tasks

### Add a new feature

1. Find relevant doc in `docs/01-game-design/` or `docs/02-technical/`
2. Read spec — implement per spec, not per intuition
3. Write engine code first (if applicable), test
4. Add UI
5. Add API endpoint if needed
6. Update docs if spec changed

### Modify schema

```bash
supabase migration new <name>
# Edit the generated SQL file
supabase db reset  # apply locally
# Test
git commit + PR
# CI deploys to staging → prod
```

### Add an Edge Function

```bash
supabase functions new <name>
# Implement
supabase functions serve  # test locally
supabase functions deploy <name>
```

### Debug an issue

1. Check Sentry (if reproducible in staging/prod)
2. Reproduce locally
3. Use Studio to inspect DB state
4. Check logs: `supabase logs -t edge-functions`
5. Browser DevTools

---

## 📚 Critical Files to Know

| File | Purpose |
|---|---|
| `src/engine/generator.ts` | Puzzle generation |
| `src/engine/solver.ts` | Uniqueness check |
| `src/engine/scoring.ts` | Score calculation |
| `src/lib/api.ts` | All Supabase API calls |
| `src/state/game-state.ts` | Game state store |
| `supabase/migrations/*.sql` | DB schema |
| `supabase/functions/submit-daily-score/index.ts` | Anti-cheat hot spot |

---

## 🎯 Where to Start (by role)

### Frontend dev
- Read: `02-technical/architecture.md`, `03-ui-ux/*`
- Start with: `src/ui/views/` — find an issue, fix it

### Backend dev
- Read: `02-technical/database-schema.md`, `02-technical/api-spec.md`
- Start with: `supabase/functions/` — improve an Edge Function

### Game design
- Read: all of `01-game-design/`
- Start with: balance numbers in `coin-economy.md`, propose tweaks

### Designer
- Read: `03-ui-ux/*`
- Start with: create theme assets in Figma → export to CSS

---

## 🚫 Don't

- **Don't push to main** — use PR
- **Don't modify migrations after applied** — create new migration
- **Don't trust client input** — always validate server-side
- **Don't change coin numbers without updating docs**
- **Don't add big libraries without discussion** — bundle size matters

---

## ✅ PR Checklist

Before opening PR:
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` works
- [ ] Manually tested affected flows
- [ ] Updated docs if behavior changed
- [ ] Migration added if schema changed
- [ ] PR description explains "why"

---

## 🆘 Get Help

- Check `docs/` first
- Issues in repo
- Owner: sirisak.unknowss@gmail.com

---

## 📋 Glossary Quick Ref

| Term | Meaning |
|---|---|
| Daily Puzzle | Same puzzle for all users today |
| Streak | Consecutive daily plays |
| Quest | 3 daily tasks |
| Practice | Non-daily 100-stage mode |
| RLS | Row-level security (Postgres) |
| Edge Function | Supabase Deno serverless |

Full glossary: `docs/00-overview/glossary.md`
