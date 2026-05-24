# 🏗️ Supabase Setup

> Step-by-step setup ของ Supabase project

## 🎯 Goals

- Local dev environment (Supabase CLI)
- Staging environment
- Production environment
- Migration management

---

## 📦 Initial Setup

### Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### Initialize Project

```bash
cd sudoku
supabase init
```

Creates:
```
supabase/
├── config.toml
├── migrations/
├── functions/
└── seed.sql
```

---

## 🖥️ Local Development

### Start Local Stack

```bash
supabase start
```

Starts:
- Postgres on `localhost:54322`
- Auth API on `localhost:54321`
- Studio (UI) on `localhost:54323`
- Storage on `localhost:54321`
- Inbucket (email testing) on `localhost:54324`

### Stop

```bash
supabase stop
```

### Reset (re-run migrations + seed)

```bash
supabase db reset
```

---

## ☁️ Cloud Projects

### Create Projects

1. https://supabase.com → create 2 projects:
   - `sudokudaily-staging`
   - `sudokudaily-prod`

2. Note these for each:
   - Project URL: `https://<ref>.supabase.co`
   - Anon key (public)
   - Service role key (server-only, KEEP SECRET)

### Link Local to Project

```bash
supabase link --project-ref <staging-ref>
# or prod
```

### Push Migrations

```bash
supabase db push
```

### Pull Remote Schema (sync from cloud)

```bash
supabase db pull
```

---

## 📋 Migrations

### Create New Migration

```bash
supabase migration new <name>
```

E.g.:
```bash
supabase migration new init
supabase migration new add_quests
supabase migration new add_shop_items
```

Creates: `supabase/migrations/<timestamp>_<name>.sql`

### Migration File Structure

```
supabase/migrations/
├── 20260101000000_init.sql              # tables, types, extensions
├── 20260101000001_rls_policies.sql      # row-level security
├── 20260101000002_triggers.sql          # auto-create profile etc.
├── 20260101000003_views.sql             # leaderboard_view etc.
├── 20260101000004_cron_jobs.sql         # pg_cron schedules
├── 20260101000005_seed_shop.sql         # initial shop items
└── 20260101000006_seed_achievements.sql # achievement defs
```

### Apply All Migrations

```bash
supabase db reset      # local (drops + recreates)
supabase db push       # remote (incremental)
```

---

## 🔑 Configure Auth

In Supabase Dashboard → Authentication:

### Email/Password
- Enable
- Email confirmation: required
- SMTP: configure (or use Supabase default for dev)

### Google OAuth
1. Create Google OAuth credentials (cloud.google.com)
2. Authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`
3. Paste Client ID/Secret in Supabase

### Apple OAuth (iOS)
- Similar process, more setup needed
- Required for App Store if Google OAuth used

### Anonymous Sign-in
- Enable in Auth settings
- "Allow anonymous sign-ins" = ON

### Settings
- JWT expiry: 3600 (1 hour)
- Refresh token expiry: 604800 (7 days)
- Site URL: `https://sudokudaily.app`
- Redirect URLs: add staging + dev URLs

---

## ⚡ Edge Functions

### Create New Function

```bash
supabase functions new <name>
```

E.g.:
```bash
supabase functions new submit-daily-score
```

### Develop Locally

```bash
supabase functions serve
```

Test:
```bash
curl -X POST http://localhost:54321/functions/v1/submit-daily-score \
  -H "Authorization: Bearer <local-anon>" \
  -d '{"date":"2026-05-23",...}'
```

### Deploy

```bash
supabase functions deploy submit-daily-score
```

Or all at once:
```bash
supabase functions deploy --no-verify-jwt false
```

### Required Functions
- `submit-daily-score`
- `submit-practice-score`
- `claim-quest-reward`
- `claim-quest-bonus`
- `purchase-item`
- `equip-item`
- `generate-daily-puzzle` (cron-callable)
- `process-streaks` (cron)
- `distribute-leaderboard-rewards` (cron)
- `register-push-token`
- `get-my-rank`
- `migrate-v1-data`
- `delete-account`

### Secrets

Set via:
```bash
supabase secrets set FCM_SERVER_KEY=<key>
supabase secrets set SENTRY_DSN=<dsn>
```

Use in function:
```ts
const fcmKey = Deno.env.get('FCM_SERVER_KEY');
```

---

## 🕒 Cron Jobs (pg_cron)

Enable extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Setup Jobs

```sql
-- 23:00 UTC daily — generate next puzzles
SELECT cron.schedule(
  'generate-daily-puzzle',
  '0 23 * * *',
  $$ SELECT net.http_post(
       url := 'https://<ref>.supabase.co/functions/v1/generate-daily-puzzle',
       headers := jsonb_build_object(
         'Authorization', 'Bearer <service-role-key>',
         'Content-Type', 'application/json'
       ),
       body := '{}'
     ) $$
);

-- 00:05 UTC — distribute leaderboard rewards
SELECT cron.schedule(
  'distribute-leaderboard-rewards',
  '5 0 * * *',
  $$ SELECT net.http_post(...) $$
);

-- 00:30 UTC — process streaks
SELECT cron.schedule(
  'process-streaks',
  '30 0 * * *',
  $$ SELECT net.http_post(...) $$
);

-- 03:00 UTC daily — trim history
SELECT cron.schedule(
  'trim-game-history',
  '0 3 * * *',
  $$ DELETE FROM user_game_history WHERE id IN (
       SELECT id FROM (
         SELECT id, row_number() OVER (
           PARTITION BY user_id ORDER BY completed_at DESC
         ) AS rn FROM user_game_history
       ) t WHERE rn > 100
     ) $$
);
```

### Manage

```sql
-- List
SELECT * FROM cron.job;

-- Remove
SELECT cron.unschedule('job-name');
```

---

## 🔐 RLS Setup

ดู [`02-technical/database-schema.md`](../02-technical/database-schema.md) — RLS policies อยู่ใน schema docs

### Verify RLS is Enabled

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

ทุก table ต้อง `rowsecurity = true`

---

## 📊 Realtime

In Dashboard → Database → Replication:
- Enable realtime for table: `daily_leaderboard`

Or via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE daily_leaderboard;
```

---

## 📦 Storage Buckets

```bash
supabase storage create avatars --public
supabase storage create backgrounds --public
```

Or via Dashboard.

Set CORS:
```json
{
  "AllowOrigin": ["*"],
  "AllowMethods": ["GET"],
  "AllowHeaders": ["*"]
}
```

---

## 🌱 Seeding

`supabase/seed.sql` — runs on `db reset`:

```sql
-- Seed shop_items
INSERT INTO shop_items (id, category, name, price_coin, ...) VALUES
  ('theme_classic', 'theme', 'Classic', 0, ...),
  ('theme_dark', 'theme', 'Dark', 200, ...),
  -- ... 65+ items
;

-- Seed achievements_definitions
INSERT INTO achievements_definitions (id, name, tier, ...) VALUES
  ('ACH_FIRST_WIN', 'First Win', 'bronze', ...),
  -- ... 50+ achievements
;
```

(Full seed data ใน batch 4)

---

## 🔍 Monitoring

### Logs (Dashboard → Logs Explorer)
- Postgres logs
- Auth logs
- Realtime logs
- Edge Function logs
- Storage logs

### Custom Logging

```ts
// In Edge Function
console.log(JSON.stringify({
  level: 'info',
  function: 'submit-daily-score',
  user_id: userId,
  score,
  duration_ms: Date.now() - start,
}));
```

→ Searchable in Logs Explorer

---

## 💾 Backup

### Auto (Pro+ plan)
- Daily backup, kept 7 days
- Point-in-time recovery (PITR)

### Manual

```bash
# Dump
supabase db dump -f backup.sql

# Restore (local)
psql -f backup.sql postgres://...
```

---

## ⚠️ Production Checklist

- [ ] All migrations applied
- [ ] RLS enabled on all tables
- [ ] Auth providers configured
- [ ] Edge Functions deployed
- [ ] Cron jobs scheduled
- [ ] Realtime enabled on `daily_leaderboard`
- [ ] Storage buckets created with proper policies
- [ ] Secrets set (FCM, Sentry, etc.)
- [ ] Custom domain configured (optional)
- [ ] Backup plan verified
- [ ] Rate limiting tuned
- [ ] Monitoring/alerting set up
