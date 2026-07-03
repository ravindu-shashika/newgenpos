#!/usr/bin/env bash
# Detect OS and run the appropriate POS app release packager.

set -euo pipefail

INSTALLER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$(uname -s)" in
  Darwin)
    bash "$INSTALLER_DIR/macos/build_dmg.sh"
    ;;
  Linux)
    bash "$INSTALLER_DIR/linux/build_deb.sh"
    ;;
  *)
    echo "Use build_release.ps1 on Windows." >&2
    exit 1
    ;;
esac
