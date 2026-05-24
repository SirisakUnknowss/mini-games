#!/usr/bin/env bash
# =====================================================================
# Phase 0 verification — checks all exit criteria
# Usage: ./scripts/verify-phase-0.sh
# =====================================================================
set -u
cd "$(dirname "$0")/.."

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
RESET='\033[0m'

pass() { echo -e "  ${GREEN}✓${RESET} $1"; }
fail() { echo -e "  ${RED}✗${RESET} $1"; FAILED=1; }
warn() { echo -e "  ${YELLOW}⚠${RESET} $1"; }
section() { echo -e "\n${YELLOW}━━━ $1 ━━━${RESET}"; }

FAILED=0

section "1. Project structure"
[ -d src/engine ] && pass "src/engine exists" || fail "src/engine missing"
[ -d src/lib ] && pass "src/lib exists" || fail "src/lib missing"
[ -d src/ui ] && pass "src/ui exists" || fail "src/ui missing"
[ -d supabase/migrations ] && pass "supabase/migrations exists" || fail "supabase/migrations missing"
[ -d tests ] && pass "tests directory exists" || fail "tests missing"
[ -d docs ] && pass "docs directory exists" || fail "docs missing"

section "2. Configs"
[ -f package.json ] && pass "package.json" || fail "package.json missing"
[ -f tsconfig.json ] && pass "tsconfig.json" || fail "tsconfig.json missing"
[ -f vite.config.ts ] && pass "vite.config.ts" || fail "vite.config.ts missing"
[ -f vitest.config.ts ] && pass "vitest.config.ts" || fail "vitest.config.ts missing"
[ -f capacitor.config.ts ] && pass "capacitor.config.ts" || fail "capacitor.config.ts missing"
[ -f .env.example ] && pass ".env.example" || fail ".env.example missing"

section "3. Database migrations"
MIG_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
if [ "$MIG_COUNT" -ge 4 ]; then
  pass "${MIG_COUNT} migration files present"
else
  fail "Only ${MIG_COUNT} migration files (expected ≥4)"
fi
[ -f supabase/seed.sql ] && pass "seed.sql" || fail "seed.sql missing"

section "4. Edge Functions"
EDGE_COUNT=$(ls supabase/functions/*/index.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$EDGE_COUNT" -ge 1 ]; then
  pass "${EDGE_COUNT} edge function(s) defined"
else
  warn "No edge functions yet"
fi

section "5. CI/CD workflows"
[ -f .github/workflows/ci.yml ] && pass "ci.yml" || fail "ci.yml missing"
[ -f .github/workflows/deploy-web.yml ] && pass "deploy-web.yml" || fail "deploy-web.yml missing"
[ -f .github/workflows/deploy-supabase.yml ] && pass "deploy-supabase.yml" || fail "deploy-supabase.yml missing"

section "6. Tests"
echo "  Running vitest..."
if ./node_modules/.bin/vitest run > /tmp/v0-test.log 2>&1; then
  TESTS=$(grep -oE '[0-9]+ passed' /tmp/v0-test.log | head -1)
  pass "Tests: $TESTS"
else
  fail "Tests failed (see /tmp/v0-test.log)"
fi

section "7. Production build"
echo "  Running build..."
if npm run build > /tmp/v0-build.log 2>&1; then
  SIZE=$(du -sh dist 2>/dev/null | awk '{print $1}')
  pass "Build succeeded (dist=${SIZE})"
else
  fail "Build failed (see /tmp/v0-build.log)"
fi

section "8. Analytics & Error tracking"
grep -q "posthog-js" package.json && pass "posthog-js installed" || fail "posthog-js missing"
grep -q "@sentry/browser" package.json && pass "@sentry/browser installed" || fail "@sentry/browser missing"
[ -f src/lib/analytics.ts ] && pass "src/lib/analytics.ts" || fail "src/lib/analytics.ts missing"

section "9. v1 Migration"
[ -f src/lib/migrate-v1.ts ] && pass "src/lib/migrate-v1.ts" || fail "src/lib/migrate-v1.ts missing"
grep -q "migrateFromV1" src/main.ts && pass "migration wired in main.ts" || fail "migration not wired"

section "10. Mobile (Capacitor)"
[ -d android ] && pass "android/ project exists" || fail "android/ missing"
[ -d ios/App ] && pass "ios/App project exists" || fail "ios/App missing"
[ -f sudoku-daily-debug.apk ] && pass "APK built ($(ls -lh sudoku-daily-debug.apk | awk '{print $5}'))" || warn "APK not built yet"

section "11. Supabase local (optional)"
if command -v supabase >/dev/null 2>&1; then
  pass "Supabase CLI installed"
  if docker ps 2>/dev/null | grep -q supabase; then
    pass "Supabase containers running"
  else
    warn "Supabase containers not running (run: supabase start)"
  fi
else
  warn "Supabase CLI not installed (run: brew install supabase/tap/supabase)"
fi

section "Summary"
if [ "$FAILED" = "0" ]; then
  echo -e "${GREEN}✅ Phase 0 — ALL CHECKS PASSED${RESET}"
  exit 0
else
  echo -e "${RED}❌ Phase 0 — Some checks failed${RESET}"
  exit 1
fi
