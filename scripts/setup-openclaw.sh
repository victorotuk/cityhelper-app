#!/bin/bash
# OpenClaw + Nava plugin setup
# Run: ./scripts/setup-openclaw.sh

set -e
cd "$(dirname "$0")/.."

echo "=== OpenClaw + Nava Plugin Setup ==="

# 1. Install OpenClaw globally (requires Node 22+)
if ! command -v openclaw &>/dev/null; then
  echo "Installing OpenClaw..."
  npm install -g openclaw@latest
  echo "OpenClaw installed. You may need to add npm global bin to PATH:"
  echo "  export PATH=\"\$(npm prefix -g)/bin:\$PATH\""
else
  echo "OpenClaw already installed: $(openclaw --version 2>/dev/null || echo 'ok')"
fi

# 2. Ensure ~/.openclaw exists
mkdir -p ~/.openclaw/extensions

# 3. Install Nava plugin (link for dev)
echo ""
echo "Installing Nava plugin..."
openclaw plugins install -l ./openclaw-nava 2>/dev/null || openclaw plugins install ./openclaw-nava

# 4. Show config instructions
echo ""
echo "=== Next Steps ==="
echo "1. Get your Nava API key: Nava app → Settings → OpenClaw & API → Generate API key"
echo "2. Add to ~/.openclaw/config.yaml (or your OpenClaw config):"
echo ""
echo "plugins:"
echo "  entries:"
echo "    nava:"
echo "      enabled: true"
echo "      config:"
echo "        api_url: \"https://YOUR-PROJECT.supabase.co/functions/v1/nava-api\""
echo "        api_key: \"nava_xxxx...\""
echo ""
echo "3. Enable Nava tools for your agent (in agents.list[].tools.allow):"
echo "   - nava_add_item"
echo "   - nava_list_items"
echo "   - nava_get_upcoming"
echo "   - nava_update_item"
echo "   - nava_delete_item"
echo "   - nava_mark_done"
echo "   - nava_snooze_item"
echo "   - nava_filter_items"
echo "   - nava_get_completed"
echo "   - nava_get_application_guide"
echo ""
echo "4. Run: openclaw gateway"
echo ""
