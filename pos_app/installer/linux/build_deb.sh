#!/usr/bin/env bash
# Builds NEWGENID POS Linux .deb package (amd64).
# Requires: Flutter SDK, dpkg-deb

set -euo pipefail

LINUX_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER_DIR="$(cd "$LINUX_DIR/.." && pwd)"
POS_APP_DIR="$(cd "$INSTALLER_DIR/.." && pwd)"
OUTPUT_DIR="$INSTALLER_DIR/output"
DEBIAN_TEMPLATE="$LINUX_DIR/debian/control.template"
DESKTOP_FILE="$LINUX_DIR/debian/newgenidpos.desktop"
POSTINST="$LINUX_DIR/debian/postinst"

# shellcheck source=/dev/null
source "$INSTALLER_DIR/scripts/read_version.sh"

PKG_ROOT="$LINUX_DIR/staging/newgenidpos"
BUNDLE_SRC="$POS_APP_DIR/build/linux/x64/release/bundle"
DEB_NAME="newgenidpos_${APP_VERSION}_amd64.deb"

echo "==> flutter pub get"
(cd "$POS_APP_DIR" && flutter pub get)

echo "==> flutter build linux --release"
(cd "$POS_APP_DIR" && flutter build linux --release)

if [[ ! -f "$BUNDLE_SRC/pos_app" ]]; then
  echo "Release build missing: $BUNDLE_SRC/pos_app" >&2
  exit 1
fi

echo "==> staging .deb contents"
rm -rf "$LINUX_DIR/staging"
mkdir -p "$PKG_ROOT/DEBIAN"
mkdir -p "$PKG_ROOT/usr/lib/newgenidpos"
mkdir -p "$PKG_ROOT/usr/share/applications"
mkdir -p "$PKG_ROOT/usr/share/icons/hicolor/256x256/apps"

cp -a "$BUNDLE_SRC/." "$PKG_ROOT/usr/lib/newgenidpos/"
cp "$DESKTOP_FILE" "$PKG_ROOT/usr/share/applications/newgenidpos.desktop"
cp "$POSTINST" "$PKG_ROOT/DEBIAN/postinst"
chmod 755 "$PKG_ROOT/DEBIAN/postinst"

if [[ -f "$POS_APP_DIR/windows/runner/resources/app_icon.ico" ]]; then
  if command -v convert >/dev/null 2>&1; then
    convert "$POS_APP_DIR/windows/runner/resources/app_icon.ico[0]" \
      "$PKG_ROOT/usr/share/icons/hicolor/256x256/apps/newgenidpos.png" || true
  fi
fi

sed "s/@VERSION@/$APP_VERSION/" "$DEBIAN_TEMPLATE" > "$PKG_ROOT/DEBIAN/control"
chmod 644 "$PKG_ROOT/DEBIAN/control"

mkdir -p "$OUTPUT_DIR"
echo "==> dpkg-deb"
dpkg-deb --root-owner-group --build "$PKG_ROOT" "$OUTPUT_DIR/$DEB_NAME"

echo "Done: $OUTPUT_DIR/$DEB_NAME"
