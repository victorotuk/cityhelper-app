#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Nava desktop release script
# Usage:  ./scripts/release.sh 0.2.0
#   or:   npm run release -- 0.2.0
#
# What it does:
#   1. Bumps version in package.json, tauri.conf.json, and Cargo.toml
#   2. Builds a signed desktop app
#   3. Generates latest.json (all platforms) ready for GitHub Releases
#   4. Tells you exactly what to upload
# ─────────────────────────────────────────────

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>  (e.g. 0.2.0)"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAURI_CONF="$ROOT/src-tauri/tauri.conf.json"
CARGO_TOML="$ROOT/src-tauri/Cargo.toml"
PKG_JSON="$ROOT/package.json"
KEY_PATH="$HOME/.tauri/nava.key"

if [ ! -f "$KEY_PATH" ]; then
  echo "ERROR: Signing key not found at $KEY_PATH"
  echo "Run:  CI=false npx tauri signer generate -w ~/.tauri/nava.key -p \"\""
  exit 1
fi

echo "══════════════════════════════════════"
echo "  Nava release v$VERSION"
echo "══════════════════════════════════════"

# ── 1. Bump versions ───────────────────────
echo ""
echo "→ Bumping version to $VERSION …"

# package.json
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('$PKG_JSON','utf8'));
  pkg.version = '$VERSION';
  fs.writeFileSync('$PKG_JSON', JSON.stringify(pkg, null, 2) + '\n');
"

# tauri.conf.json
node -e "
  const fs = require('fs');
  const cfg = JSON.parse(fs.readFileSync('$TAURI_CONF','utf8'));
  cfg.version = '$VERSION';
  fs.writeFileSync('$TAURI_CONF', JSON.stringify(cfg, null, 2) + '\n');
"

# Cargo.toml
sed -i.bak "s/^version = \".*\"/version = \"$VERSION\"/" "$CARGO_TOML" && rm -f "$CARGO_TOML.bak"

echo "   package.json    → $VERSION"
echo "   tauri.conf.json → $VERSION"
echo "   Cargo.toml      → $VERSION"

# ── 2. Build signed app ───────────────────
echo ""
echo "→ Building signed desktop app …"
export TAURI_SIGNING_PRIVATE_KEY
TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_PATH")"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""

cd "$ROOT"
CI=false npm run tauri:build

# ── 3. Locate artifacts ──────────────────
BUNDLE_DIR="$ROOT/src-tauri/target/release/bundle"

MAC_TAR="$BUNDLE_DIR/macos/Nava.app.tar.gz"
MAC_SIG="$BUNDLE_DIR/macos/Nava.app.tar.gz.sig"
MAC_DMG="$BUNDLE_DIR/dmg/Nava_${VERSION}_aarch64.dmg"

if [ ! -f "$MAC_TAR" ]; then
  SANDBOX_TARGET=$(find /var/folders -path "*/cursor-sandbox-cache/*/cargo-target/release/bundle" -maxdepth 8 2>/dev/null | head -1)
  if [ -n "$SANDBOX_TARGET" ]; then
    BUNDLE_DIR="$SANDBOX_TARGET"
    MAC_TAR="$BUNDLE_DIR/macos/Nava.app.tar.gz"
    MAC_SIG="$BUNDLE_DIR/macos/Nava.app.tar.gz.sig"
    MAC_DMG=$(find "$BUNDLE_DIR/dmg" -name "*.dmg" 2>/dev/null | head -1)
  fi
fi

# ── 4. Generate latest.json (all platforms) ──
echo ""
echo "→ Generating latest.json …"

MAC_SIGNATURE=""
if [ -f "$MAC_SIG" ]; then
  MAC_SIGNATURE="$(cat "$MAC_SIG")"
fi

REPO_URL="https://github.com/victorotuk/cityhelper-app"

cat > "$ROOT/latest.json" <<ENDJSON
{
  "version": "$VERSION",
  "notes": "Nava v$VERSION",
  "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {
    "darwin-aarch64": {
      "signature": "$MAC_SIGNATURE",
      "url": "$REPO_URL/releases/download/v$VERSION/Nava.app.tar.gz"
    },
    "darwin-x86_64": {
      "signature": "$MAC_SIGNATURE",
      "url": "$REPO_URL/releases/download/v$VERSION/Nava.app.tar.gz"
    },
    "windows-x86_64": {
      "signature": "",
      "url": "$REPO_URL/releases/download/v$VERSION/Nava_${VERSION}_x64-setup.exe"
    },
    "linux-x86_64": {
      "signature": "",
      "url": "$REPO_URL/releases/download/v$VERSION/nava_${VERSION}_amd64.AppImage"
    }
  }
}
ENDJSON

echo "   Written to $ROOT/latest.json"
echo "   NOTE: Windows/Linux signatures are empty — fill from CI build .sig files if available."

# ── 5. Summary ────────────────────────────
echo ""
echo "══════════════════════════════════════"
echo "  BUILD COMPLETE — v$VERSION"
echo "══════════════════════════════════════"
echo ""
echo "Artifacts:"
[ -f "$MAC_DMG" ] && echo "  DMG (first install): $MAC_DMG"
[ -f "$MAC_TAR" ] && echo "  Update bundle:       $MAC_TAR"
[ -f "$MAC_SIG" ] && echo "  Signature:           $MAC_SIG"
echo "  Update manifest:     $ROOT/latest.json"
echo ""
echo "To publish:"
echo "  1. git add -A && git commit -m 'release v$VERSION'"
echo "  2. git tag v$VERSION && git push --tags"
echo "  3. gh release create v$VERSION --title 'v$VERSION' \\"
[ -f "$MAC_DMG" ] && echo "       '$MAC_DMG' \\"
[ -f "$MAC_TAR" ] && echo "       '$MAC_TAR' \\"
echo "       '$ROOT/latest.json'"
echo ""
echo "Users with the app installed will get a prompt to update automatically."
echo "══════════════════════════════════════"
