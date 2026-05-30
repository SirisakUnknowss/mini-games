# Release Guide

Step-by-step for shipping Sudoku Daily to the Play Store, App Store, and GitHub Releases.

---

## 0. Pre-flight checklist

Before each release:
- [ ] `npm run typecheck` — no errors
- [ ] `npm run test:run` — all green
- [ ] `npm run build` — succeeds, bundle size acceptable
- [ ] Bump `package.json` version + `android/app/build.gradle` `versionCode` + `versionName`
- [ ] Bump `ios/App/App.xcodeproj/project.pbxproj` `MARKETING_VERSION` + `CURRENT_PROJECT_VERSION`
- [ ] Update `CHANGELOG.md` `[Unreleased]` → cut a new version section
- [ ] Commit + tag: `git tag v0.1.0 && git push --tags`

---

## 1. Android — Play Store

### One-time setup

#### 1a. Create your signing keystore
```bash
cd sudoku
./scripts/generate-keystore.sh
```
This creates `android/app/sudoku-daily-release.keystore`. **Back it up immediately** — losing it means you can never push updates to your Play Store listing.

#### 1b. Create `android/keystore.properties` (NOT committed)
```properties
storeFile=sudoku-daily-release.keystore
storePassword=your-long-store-password
keyAlias=sudoku-daily
keyPassword=your-long-key-password
```

#### 1c. Wire signing into Gradle
Edit `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 1d. Play Console account
- Cost: **$25 one-time**
- Sign up: https://play.google.com/console/signup
- Create a new app → "Sudoku Daily" → category: Games → subcategory: Puzzle
- Fill: short description (80 chars), full description, screenshots (min 2, phone 16:9 1080×1920 recommended), feature graphic (1024×500), app icon (512×512 PNG)
- Privacy policy URL: `https://sudokudaily.app/legal/PRIVACY` (or GitHub Pages of `legal/PRIVACY.md`)
- Data safety form — fill honestly per `legal/PRIVACY.md`

### Per-release flow

```bash
cd sudoku
./scripts/release-android.sh 0.1.0     # builds AAB + APK into ../releases/
```

Then:
1. **Play Console → Internal testing → Create new release**
2. Upload `releases/sudoku-daily-v0.1.0.aab`
3. Release notes (250 chars max)
4. Save → Review → Roll out
5. Add yourself + testers under "Testers" list
6. Install via the test link on a real device

When ready for production:
- Promote the internal release → **Closed testing** → **Open testing** → **Production**
- Each promotion requires a separate review (1–7 days)

---

## 2. iOS — App Store

### One-time setup
- Cost: **$99/year** Apple Developer Program
- Sign up: https://developer.apple.com/programs/
- App Store Connect → My Apps → "+" → New App → Bundle ID: `app.sudokudaily` (or whatever matches `ios/App/App.xcodeproj`)
- Fill metadata (similar to Play Console)
- Screenshots required: **6.7"** (1290×2796), **6.5"** (1242×2688), **iPad Pro 12.9"** (2048×2732) — at least 1 per size

### Per-release flow

```bash
cd sudoku
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:
1. Select target **App** → Signing & Capabilities → check "Automatically manage signing", pick your team
2. Bump **Version** + **Build** numbers under General
3. Product → **Archive**
4. Window → Organizer → select the archive → **Distribute App** → **App Store Connect**
5. Upload (~15 min processing)
6. App Store Connect → TestFlight → add the build → invite testers (internal: instant, external: review required)
7. When ready: App Store → submit for review (1–3 days typical)

### Free 7-day device install (no $99 account)
For quick personal testing only:
1. Plug in iPhone, trust the Mac
2. Xcode → select device → Build & Run
3. Trust the developer profile: Settings → General → VPN & Device Management → trust your Apple ID
4. App expires after 7 days — rebuild to reinstall

---

## 3. Web / PWA

Production hosting (recommended: Cloudflare Pages or Vercel — both free for this scale):

```bash
cd sudoku
npm run build
# Upload sudoku/dist/ to your host
```

Or auto-deploy via the GitHub Actions workflow in `.github/workflows/`.

---

## 4. GitHub Release

For each tagged version:
```bash
git tag v0.1.0
git push --tags
gh release create v0.1.0 \
  --title "v0.1.0 — Phase 1-3 features" \
  --notes-file releases/v0.1.0.md \
  releases/sudoku-daily-v0.1.0.apk
```

Don't attach the AAB — that's for Play Store only. APK is fine for sideload / archival.

---

## 5. Secrets management

| Secret | Stored in | Used by |
|---|---|---|
| Keystore file | Password manager + 1 offline copy | Local `./scripts/release-android.sh` |
| Keystore passwords | Password manager | `android/keystore.properties` (gitignored) |
| Apple App-Specific Password | Apple ID account | Xcode upload |
| Supabase service-role key | Supabase dashboard | Edge functions only (never client) |
| Supabase anon key | `.env.local` + GitHub Actions secrets | Client + CI |
| PostHog / Sentry DSN | `.env.local` + GitHub Actions secrets | Client |

**Never commit:**
- `*.keystore` files
- `keystore.properties`
- `.env*` (except `.env.example`)
- Apple provisioning profiles
- Anything containing the word "secret" or "service_role"

The repo `.gitignore` already covers most of these. Audit with: `git ls-files | grep -iE "(secret|keystore|\.env$|service_role)"`

---

## 6. Rollback

If a release breaks:
- **Play Store**: Console → release → Halt rollout → next version supersedes it. Users on the broken version stay there until you ship a fix.
- **App Store**: Console → Phased Release pause. No direct rollback — you must ship a fix.
- **Web**: revert the deploy in Cloudflare/Vercel UI (1 click).

Always have a `versionCode` / build number greater than the broken one. You cannot reuse a version number that has been uploaded — even for a different binary.

---

## 7. After-launch checklist

- [ ] Verify install works on a real device (Android + iOS)
- [ ] Daily puzzle loads
- [ ] Sign up + sign in works
- [ ] Score submit reaches Supabase
- [ ] Leaderboard shows your row
- [ ] Crash reports flowing to Sentry
- [ ] Analytics events flowing to PostHog
- [ ] Privacy + Terms links resolve from inside the app and from the store listing
