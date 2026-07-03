#!/usr/bin/env bash
# Reads version and build number from pos_app/pubspec.yaml.
# Usage: source read_version.sh  (sets APP_VERSION and APP_BUILD)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBSPEC="${PUBSPEC_PATH:-$SCRIPT_DIR/../../pubspec.yaml}"

if [[ ! -f "$PUBSPEC" ]]; then
  echo "pubspec.yaml not found at $PUBSPEC" >&2
  exit 1
fi

line="$(grep -E '^version:' "$PUBSPEC" | head -n1)"
if [[ "$line" =~ version:[[:space:]]*([0-9]+\.[0-9]+\.[0-9]+)\+([0-9]+) ]]; then
  APP_VERSION="${BASH_REMATCH[1]}"
  APP_BUILD="${BASH_REMATCH[2]}"
else
  echo "Could not parse version from pubspec.yaml (expected format: 0.1.0+1)" >&2
  exit 1
fi

export APP_VERSION APP_BUILD
echo "APP_VERSION=$APP_VERSION"
echo "APP_BUILD=$APP_BUILD"
