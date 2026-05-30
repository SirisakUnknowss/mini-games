#!/usr/bin/env bash
# =====================================================================
# Build a signed Android release (AAB for Play Store + APK for sideload).
# Requires: keystore + android/keystore.properties already set up.
#
# Usage: ./scripts/release-android.sh [version]
#   version: optional semver (e.g. 0.1.0). Used in output filename.
# =====================================================================
set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version")}"
OUT_DIR="releases"
KEYSTORE_PROPS="android/keystore.properties"

if [[ ! -f "$KEYSTORE_PROPS" ]]; then
  echo "❌  $KEYSTORE_PROPS not found."
  echo "    Run: ./scripts/generate-keystore.sh  (then create the props file)"
  echo "    See: docs/RELEASE.md  for full setup."
  exit 1
fi

echo "▶︎ Building web bundle..."
npm run build

echo "▶︎ Syncing Capacitor..."
npx cap sync android

echo "▶︎ Building signed AAB (for Play Store)..."
( cd android && ./gradlew bundleRelease )

echo "▶︎ Building signed APK (for sideload / GitHub Releases)..."
( cd android && ./gradlew assembleRelease )

mkdir -p "$OUT_DIR"
AAB_SRC="android/app/build/outputs/bundle/release/app-release.aab"
APK_SRC="android/app/build/outputs/apk/release/app-release.apk"

cp "$AAB_SRC" "$OUT_DIR/sudoku-daily-v${VERSION}.aab"
cp "$APK_SRC" "$OUT_DIR/sudoku-daily-v${VERSION}.apk"

echo
echo "✅  Release artifacts:"
ls -lh "$OUT_DIR/sudoku-daily-v${VERSION}.aab" "$OUT_DIR/sudoku-daily-v${VERSION}.apk"
echo
echo "Next steps:"
echo "  1. Upload the .aab to Play Console → Internal testing"
echo "  2. Attach the .apk to a GitHub Release for sideload"
echo "  3. (Recommended) Test the signed APK on a real device first:"
echo "     adb install $OUT_DIR/sudoku-daily-v${VERSION}.apk"
