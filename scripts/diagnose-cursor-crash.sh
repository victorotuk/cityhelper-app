#!/bin/bash
# Diagnose Cursor IDE crashes on macOS
# Run: ./scripts/diagnose-cursor-crash.sh

set -e
OUTPUT="/tmp/cursor-crash-report-$(date +%Y%m%d-%H%M%S).txt"
exec > "$OUTPUT" 2>&1

echo "=== Cursor Crash Diagnostic Report ==="
echo "Date: $(date)"
echo ""

echo "=== System ==="
sw_vers
echo ""

echo "=== Memory ==="
vm_stat 2>/dev/null || true
echo ""

echo "=== Cursor Logs (last 50 lines of main log) ==="
LOG_DIR="$HOME/Library/Application Support/Cursor/logs"
if [ -d "$LOG_DIR" ]; then
  echo "Log directory: $LOG_DIR"
  ls -la "$LOG_DIR" 2>/dev/null || true
  echo ""
  MAIN_LOG=$(find "$LOG_DIR" -name "*.log" -type f 2>/dev/null | head -1)
  if [ -n "$MAIN_LOG" ]; then
    echo "--- Last 50 lines of $MAIN_LOG ---"
    tail -50 "$MAIN_LOG" 2>/dev/null || true
  fi
  echo ""
  echo "--- Extension host logs (if any) ---"
  find "$LOG_DIR" -name "*exthost*" -o -name "*extension*" 2>/dev/null | head -5
  for f in $(find "$LOG_DIR" -name "*exthost*" -o -name "*extension*" 2>/dev/null | head -3); do
    echo "--- $f (last 30 lines) ---"
    tail -30 "$f" 2>/dev/null || true
  done
else
  echo "Cursor log directory not found"
fi
echo ""

echo "=== Recent Crash Reports (macOS) ==="
CRASH_DIR="$HOME/Library/Logs/DiagnosticReports"
if [ -d "$CRASH_DIR" ]; then
  echo "Cursor-related crashes (last 7 days):"
  find "$CRASH_DIR" -name "*Cursor*" -mtime -7 2>/dev/null | head -20
  echo ""
  echo "Chrome/crashpad (Cursor uses Electron):"
  find "$CRASH_DIR" -name "*chrome*" -o -name "*Electron*" -mtime -7 2>/dev/null | head -10
else
  echo "DiagnosticReports not found"
fi
echo ""

echo "=== Cursor Data Size ==="
CURSOR_APP="$HOME/Library/Application Support/Cursor"
if [ -d "$CURSOR_APP" ]; then
  du -sh "$CURSOR_APP" 2>/dev/null || true
  echo ""
  echo "Largest subdirs:"
  du -sh "$CURSOR_APP"/* 2>/dev/null | sort -hr | head -10
fi
echo ""

echo "=== Known Issues (from web search) ==="
echo "- macOS 26+ (Tahoe): Cursor built with macOS 14.5 SDK; os_log API changes cause crashpad_handler"
echo "- Extension host crashes ~47-54s after startup on some macOS 26+"
echo "- V8 OOM during GC on Apple Silicon"
echo ""
echo "=== Quick Fixes to Try ==="
echo "1. Reset Cursor data: mv ~/Library/Application\\ Support/Cursor ~/Library/Application\\ Support/CursorBackup"
echo "2. Disable extensions one by one"
echo "3. Reduce workspace size (e.g. add large folders to .cursorignore)"
echo "4. Check Cursor version; update if available"
echo ""

echo "Report saved to: $OUTPUT"
echo "(In /tmp/ to avoid polluting workspace)"
echo "Share this file with Cursor support or open a GitHub issue."
