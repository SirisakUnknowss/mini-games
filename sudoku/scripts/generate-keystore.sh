#!/usr/bin/env bash
# =====================================================================
# Generate a release signing keystore for Android.
# Run ONCE per app. KEEP THE OUTPUT FILE SAFE — losing it means you can
# never publish an update to the existing Play Store listing.
#
# Usage: ./scripts/generate-keystore.sh
# =====================================================================
set -euo pipefail

KEYSTORE_PATH="${KEYSTORE_PATH:-android/app/sudoku-daily-release.keystore}"
KEY_ALIAS="${KEY_ALIAS:-sudoku-daily}"
VALIDITY_DAYS="${VALIDITY_DAYS:-10000}"   # ~27 years (Play Store recommendation: >=25y)

if [[ -f "$KEYSTORE_PATH" ]]; then
  echo "❌  Keystore already exists at: $KEYSTORE_PATH"
  echo "    Refusing to overwrite. Move or delete the file first."
  exit 1
fi

mkdir -p "$(dirname "$KEYSTORE_PATH")"

echo "🔐  Creating release keystore at: $KEYSTORE_PATH"
echo "    Alias: $KEY_ALIAS"
echo "    Validity: $VALIDITY_DAYS days"
echo
echo "You'll be asked for:"
echo "  - A keystore password (LONG, save in a password manager)"
echo "  - A key password (can be the same)"
echo "  - Your name / org / location (used on the cert — anything works)"
echo
read -p "Press Enter to continue, Ctrl-C to abort..."

keytool -genkeypair \
  -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity "$VALIDITY_DAYS"

echo
echo "✅  Keystore created."
echo
echo "🚨  NEXT STEPS — DO NOT SKIP:"
echo "    1. Back up the file: $KEYSTORE_PATH"
echo "       Copy it to a password manager (1Password, Bitwarden) or"
echo "       offline storage. If you lose this file, you cannot publish"
echo "       updates to the existing listing — ever."
echo "    2. Save the keystore + key passwords in a password manager."
echo "    3. Add the path to .gitignore (it's already covered by *.keystore)."
echo "    4. Create android/keystore.properties (NOT committed):"
echo "         storeFile=sudoku-daily-release.keystore"
echo "         storePassword=YOUR_STORE_PASSWORD"
echo "         keyAlias=$KEY_ALIAS"
echo "         keyPassword=YOUR_KEY_PASSWORD"
