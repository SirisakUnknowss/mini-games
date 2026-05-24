# 🤖 CI/CD with GitHub Actions

## 📋 Workflows

```
.github/workflows/
├── ci.yml              # Lint + test on PR
├── deploy-web.yml      # Deploy to Cloudflare Pages
├── deploy-supabase.yml # Apply migrations + functions
└── release-mobile.yml  # Manual: build for app stores
```

---

## 🧪 `ci.yml` — Lint, Test, Build

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, staging]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

      - name: Upload build artifacts
        if: github.event_name == 'pull_request'
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.event.pull_request.number }}
          path: dist
```

---

## 🌐 `deploy-web.yml` — Cloudflare Pages

```yaml
name: Deploy Web

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }

      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL_PROD }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY_PROD }}
          VITE_POSTHOG_KEY: ${{ secrets.VITE_POSTHOG_KEY }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: sudokudaily
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

---

## ⚡ `deploy-supabase.yml` — Migrations + Functions

```yaml
name: Deploy Supabase

on:
  push:
    branches: [main]
    paths:
      - 'supabase/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: latest }

      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - run: supabase db push
        env:
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

      - run: supabase functions deploy --no-verify-jwt false
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 📱 `release-mobile.yml` — Mobile Build

```yaml
name: Release Mobile

on:
  workflow_dispatch:
    inputs:
      platform:
        type: choice
        options: [android, ios, both]
      version:
        type: string

jobs:
  android:
    if: inputs.platform == 'android' || inputs.platform == 'both'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/setup-java@v3
        with: { distribution: temurin, java-version: 17 }

      - run: npm ci
      - run: npm run build
      - run: npx cap sync android

      - name: Build AAB
        working-directory: android
        run: ./gradlew bundleRelease

      - name: Sign AAB
        run: |
          jarsigner -keystore <keystore> \
            -storepass ${{ secrets.ANDROID_KEYSTORE_PASSWORD }} \
            android/app/build/outputs/bundle/release/app-release.aab \
            sudoku

      - name: Upload to Play Store
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: app.sudokudaily
          releaseFiles: android/app/build/outputs/bundle/release/app-release.aab
          track: internal

  ios:
    if: inputs.platform == 'ios' || inputs.platform == 'both'
    runs-on: macos-latest
    steps:
      # similar with xcodebuild + fastlane
```

---

## 🔐 Secrets Required

Set in GitHub repo → Settings → Secrets:

### Production
- `VITE_SUPABASE_URL_PROD`
- `VITE_SUPABASE_ANON_KEY_PROD`
- `VITE_POSTHOG_KEY`
- `VITE_SENTRY_DSN`
- `CF_API_TOKEN`
- `CF_ACCOUNT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID` (prod)
- `SUPABASE_DB_PASSWORD` (prod)

### Mobile
- `ANDROID_KEYSTORE_BASE64` (base64 of .keystore file)
- `ANDROID_KEYSTORE_PASSWORD`
- `GOOGLE_PLAY_SERVICE_ACCOUNT` (JSON)
- `APPLE_API_KEY` (for fastlane)
- `APPLE_API_KEY_ID`
- `APPLE_API_ISSUER`

---

## 📦 Branch Strategy

```
main      ← prod (auto-deploy)
  ↑ PR
staging   ← staging env (auto-deploy)
  ↑ PR
feature/* ← preview deploy
```

### PR Process
1. Open PR from feature → staging
2. CI runs (lint + test + build)
3. Cloudflare creates preview URL
4. Review + merge to staging
5. QA in staging env
6. PR staging → main
7. Auto-deploy to prod

---

## 🔔 Slack Notifications

Add to `deploy-web.yml`:
```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "Web deploy: ${{ job.status }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## ⚠️ Caveats

- Cloudflare Pages preview มี subdomain — auth providers ต้อง whitelist (`*.pages.dev` หรือ wildcard)
- Supabase migrations เป็น forward-only — rollback ต้องเขียน migration ใหม่
- Mobile build เสีย macOS minute ของ GitHub Actions ($$$) — เก็บไว้ใช้ตอน release จริง
- ห้ามรัน migrations จาก local กับ prod — ใช้ workflow เสมอ
