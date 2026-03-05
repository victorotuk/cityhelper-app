#!/bin/bash
# Backup Cursor workspace state into the project (for committing to GitHub)
# Run BEFORE deleting ~/Library/Application Support/Cursor
# The backup can be restored later if needed.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CURSOR_STORAGE="$HOME/Library/Application Support/Cursor/User/workspaceStorage"
BACKUP_DIR="$REPO_ROOT/.cursor-backup"

if [ ! -d "$CURSOR_STORAGE" ]; then
  echo "Cursor storage not found at $CURSOR_STORAGE"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
echo "Backing up Cursor workspace state..."

# Find workspace for this project (path often encoded in workspace.json)
for dir in "$CURSOR_STORAGE"/*/; do
  if [ -f "${dir}workspace.json" ] && grep -q "cityhelper\|nava" "${dir}workspace.json" 2>/dev/null; then
    cp -r "$dir" "$BACKUP_DIR/workspace-$(basename "$dir")"
    echo "  Copied $(basename "$dir")"
  fi
done

# Also copy any state.vscdb we find (prompts are in aiService.generations)
for vscdb in "$CURSOR_STORAGE"/*/state.vscdb; do
  if [ -f "$vscdb" ]; then
    dir=$(dirname "$vscdb")
    name=$(basename "$dir")
    mkdir -p "$BACKUP_DIR"
    cp "$vscdb" "$BACKUP_DIR/state-${name}.vscdb"
    echo "  Backed up state from $name"
  fi
done

# If no specific match, backup the most recently modified workspace
if [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
  latest=$(ls -td "$CURSOR_STORAGE"/*/ 2>/dev/null | head -1)
  if [ -n "$latest" ]; then
    cp -r "$latest" "$BACKUP_DIR/workspace-latest"
    echo "  Backed up latest workspace (no path match)"
  fi
fi

echo ""
echo "Backup saved to $BACKUP_DIR"
echo "Add to git: git add .cursor-backup && git commit -m 'chore: backup Cursor workspace state'"
echo ""
echo "To restore later: copy contents back to $CURSOR_STORAGE (Cursor must be closed)"
