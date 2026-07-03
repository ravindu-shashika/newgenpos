#!/usr/bin/env bash
# Builds KOOBIYA POS macOS .dmg from Flutter release.
# Requires: Flutter SDK, macOS with hdiutil

set -euo pipefail

MACOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER_DIR="$(cd "$MACOS_DIR/.." && pwd)"
POS_APP_DIR="$(cd "$INSTALLER_DIR/.." && pwd)"
OUTPUT_DIR="$INSTALLER_DIR/output"
STAGING_DIR="$MACOS_DIR/staging"
APP_SRC="$POS_APP_DIR/build/macos/Build/Products/Release/pos_app.app"

# shellcheck source=/dev/null
source "$INSTALLER_DIR/scripts/read_version.sh"

DMG_NAME="KOOBIYA-POS-${APP_VERSION}-macos.dmg"
DMG_PATH="$OUTPUT_DIR/$DMG_NAME"

echo "==> flutter pub get"
(cd "$POS_APP_DIR" && flutter pub get)

echo "==> flutter build macos --release"
(cd "$POS_APP_DIR" && flutter build macos --release)

if [[ ! -d "$APP_SRC" ]]; then
  echo "Release app missing: $APP_SRC" >&2
  exit 1
fi

echo "==> staging DMG"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"
cp -R "$APP_SRC" "$STAGING_DIR/"
ln -sf /Applications "$STAGING_DIR/Applications"

mkdir -p "$OUTPUT_DIR"
rm -f "$DMG_PATH"

echo "==> hdiutil create"
hdiutil create \
  -volname "KOOBIYA POS" \
  -srcfolder "$STAGING_DIR" \
  -ov \
  -format UDZO \
  "$DMG_PATH"

echo "Done: $DMG_PATH"
