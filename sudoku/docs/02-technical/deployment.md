# 🚀 Deployment

## 🌐 Web (PWA)

### Hosting: Cloudflare Pages

**Setup:**
1. Connect GitHub repo to Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`
4. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTHOG_KEY`, etc.

**Domain:**
- Prod: `sudokudaily.app` (TBD)
- Staging: `staging.sudokudaily.app`
- Preview: `<branch>.sudokudaily.pages.dev` (auto by Cloudflare)

### Build Command
```bash
npm run build
# Outputs to /dist
```

### Service Worker
- Workbox generates `sw.js` automatically (`vite-plugin-pwa`)
- Update flow: skip waiting + reload prompt

### CDN
- Cloudflare CDN included
- Custom rules: cache images 1 year, HTML 5 min

---

## 📱 Mobile (Capacitor)

### Setup
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Sudoku Daily" "app.sudokudaily"

npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Plugins
npm install @capacitor/push-notifications @capacitor/haptics \
  @capacitor/share @capacitor/network @capacitor/preferences
```

### capacitor.config.ts
```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.sudokudaily',
  appName: 'Sudoku Daily',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
};
export default config;
```

### Build Flow

```bash
# 1. Build web
npm run build

# 2. Sync to native projects
npx cap sync

# 3a. Android
npx cap open android
# Then: Android Studio → Build → Generate Signed Bundle/APK

# 3b. iOS
npx cap open ios
# Then: Xcode → Product → Archive
```

---

## 🤖 Android Deployment

### Play Store

**Prerequisites:**
- Google Play Console account ($25 one-time)
- App signing key
- Privacy policy URL
- Store listing assets:
  - Icon 512×512
  - Feature graphic 1024×500
  - Phone screenshots ×2 minimum
  - Description (short + full)

**Signing:**
```bash
keytool -genkey -v -keystore sudoku.keystore \
  -alias sudoku -keyalg RSA -keysize 2048 -validity 10000
```

**Build AAB:**
- Android Studio → Build → Generate Signed Bundle → Choose .aab
- Upload to Play Console → Internal Testing → eventually Production

**Versioning:**
- `versionCode`: integer, increment every release
- `versionName`: semver, e.g., "1.0.0"

---

## 🍏 iOS Deployment

### App Store

**Prerequisites:**
- Apple Developer Program ($99/year)
- Mac with Xcode
- Bundle ID registered
- Provisioning profile

**Required Assets:**
- App Icon (1024×1024)
- Screenshots: iPhone 6.7" + 6.5" + 5.5"
- Privacy policy
- Privacy declaration (data collected)

**Required Capabilities:**
- Sign in with Apple (if OAuth used)
- Push Notifications

**Build:**
- Xcode → Select "Any iOS Device" target → Product → Archive
- Window → Organizer → Distribute App → App Store Connect

---

## 🌍 Supabase Production

### Project Setup
1. Create new Supabase project (production)
2. Run migrations (ดู `05-infrastructure/supabase-setup.md`)
3. Configure Auth providers
4. Set up environment vars
5. Configure custom domain (optional)

### Migrations
```bash
supabase link --project-ref <prod-ref>
supabase db push
```

### Secrets
ตั้งใน Supabase Dashboard:
- `FCM_SERVER_KEY`
- `SERVICE_ROLE_KEY` (already exists)

### Edge Functions Deploy
```bash
supabase functions deploy submit-daily-score --no-verify-jwt false
supabase functions deploy claim-quest-reward
# ... all functions
```

---

## 🔄 CI/CD Pipeline

ดู `05-infrastructure/github-actions.md` สำหรับ detail

### Trigger Map
| Event | Action |
|---|---|
| PR open | Lint + test + build preview |
| Push to `main` | Deploy to Cloudflare Pages (prod web) |
| Push to `staging` | Deploy to staging |
| Push tag `v*` | Build Capacitor + manual mobile release |
| Merge PR with `supabase/` changes | Auto-deploy migrations + functions |

---

## 🏷️ Versioning

### Web
- Semver: `1.2.3`
- Stored in `package.json`
- Show in Settings screen

### Mobile
- Same as web + native version codes

### Database
- Migration files numbered: `0001_init.sql`, `0002_add_quests.sql`, ...

### API
- Edge Functions versioned by deployment
- Breaking changes → new function with `_v2` suffix

---

## 📋 Release Checklist

### Pre-release
- [ ] All tests passing
- [ ] Manual smoke test critical flows
- [ ] Bump version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Database migration tested in staging
- [ ] Privacy policy up-to-date

### Web release
- [ ] Merge to `main`
- [ ] Verify deploy succeeded
- [ ] Smoke test on prod URL
- [ ] Monitor Sentry for errors (15 min)

### Mobile release
- [ ] Build AAB / IPA
- [ ] Internal test track first
- [ ] Promote to production after 24h
- [ ] Update store listing if needed

---

## 🚨 Rollback

### Web
- Cloudflare Pages: "Rollback" button in dashboard
- Or revert commit and redeploy

### Database
- Migrations are forward-only
- Rollback = write new migration that reverses
- Backup first (Supabase auto-backup daily on Pro)

### Mobile
- Can't rollback once published — must release fix
- Use staged rollout (5% → 25% → 100%) to catch issues

---

## 🌍 Multi-environment

### Local Dev
```bash
supabase start  # local Postgres + Auth + Functions
npm run dev     # Vite dev server
```

### Staging
- Supabase project: `sudokudaily-staging`
- Cloudflare Pages: `staging.sudokudaily.app`
- Use for QA before prod

### Production
- Supabase project: `sudokudaily-prod`
- Cloudflare Pages: `sudokudaily.app`

ดู `05-infrastructure/environments.md`
