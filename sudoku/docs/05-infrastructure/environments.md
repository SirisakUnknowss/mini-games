# 🌍 Environments

## 📋 3 Environments

| Env | Purpose | URL | Supabase |
|---|---|---|---|
| **local** | Dev machine | localhost:5173 | localhost:54321 |
| **staging** | QA before prod | staging.sudokudaily.app | sudokudaily-staging |
| **production** | Real users | sudokudaily.app | sudokudaily-prod |

---

## 🖥️ Local Dev

### `.env.local`
```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from `supabase status`>
VITE_APP_ENV=local
VITE_APP_VERSION=dev
VITE_POSTHOG_KEY=    # empty = disabled
VITE_SENTRY_DSN=     # empty = disabled
```

### Run
```bash
supabase start
npm run dev
```

### Reset DB
```bash
supabase db reset
```

---

## 🧪 Staging

### Supabase Project
- `sudokudaily-staging.supabase.co`
- Free tier
- Separate DB from prod
- Same migrations as prod

### Web Hosting
- Cloudflare Pages: `sudokudaily-staging`
- Domain: `staging.sudokudaily.app`
- Auto-deploy: push to `staging` branch

### `.env.staging` (in CI)
```bash
VITE_SUPABASE_URL=https://<staging-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon>
VITE_APP_ENV=staging
VITE_APP_VERSION=<git sha>
VITE_POSTHOG_KEY=<test key or disabled>
VITE_SENTRY_DSN=<staging dsn>
```

### Auth Providers
- Google OAuth: separate app for staging
- Email: use Inbucket or real SMTP with test domain

### Mobile
- Android: separate `app.sudokudaily.staging` package
- iOS: separate bundle ID

---

## 🚀 Production

### Supabase Project
- `<prod-ref>.supabase.co`
- Pro plan ($25/mo)
- Auto backups daily

### Web Hosting
- Cloudflare Pages: `sudokudaily`
- Domain: `sudokudaily.app`
- Auto-deploy: push to `main`

### `.env.production` (in CI)
```bash
VITE_SUPABASE_URL=https://<prod-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-anon>
VITE_APP_ENV=production
VITE_APP_VERSION=<package.json version>
VITE_POSTHOG_KEY=<prod key>
VITE_SENTRY_DSN=<prod dsn>
```

### Mobile
- Android: `app.sudokudaily`
- iOS: `app.sudokudaily`

---

## 🔐 Secrets Management

### Local
- `.env.local` (in .gitignore)
- Never commit

### Staging/Prod
- GitHub Actions Secrets
- Supabase Dashboard Secrets (for Edge Functions)
- Cloudflare Pages env vars

### Rotation
- API keys: rotate quarterly
- After any leak: immediate rotation

---

## 🛡️ Promotion Flow

```
local
  ↓ commit + push
feature branch
  ↓ PR
staging branch → staging env
  ↓ test
  ↓ PR
main branch → production
```

**Never:**
- Direct push to `main`
- Direct push to `staging`
- Migration ตรงๆ บน prod DB (ผ่าน CI only)

---

## 🎯 Environment Differences

| Feature | Local | Staging | Prod |
|---|---|---|---|
| Analytics | Off | Test events | Real |
| Sentry | Off | Active (separate project) | Active |
| Auth email | Inbucket | Real SMTP test | Real SMTP |
| Push notif | FCM test | FCM test | FCM prod |
| Realtime | On | On | On |
| Cron | Off | On (less frequent) | On |
| Backups | None | Manual | Auto daily |
| Rate limits | Off | Relaxed | Strict |
| Logging | Console | Sentry | Sentry + retention |
