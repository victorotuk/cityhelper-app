# Reduce Cursor Crashes

Cursor can crash on **macOS 26+ (Tahoe)** due to compatibility issues. These steps reduce load and may help.

## 1. .cursorignore (Reduce Indexing)

Add these lines to `.cursorignore` if not present:

```
android/app/build
android/app/src/main/assets/public
ios/App/App/public
package-lock.json
cursor-crash-report-*.txt
```

This stops Cursor from indexing build artifacts and large generated files.

## 2. Delete Build Artifacts (Optional)

Free space and reduce workspace size:

```bash
rm -rf android/app/build
rm -rf android/app/src/main/assets/public
rm -rf ios/App/App/public
```

Regenerate with: `npm run build && npx cap sync`

## 3. Run Diagnostics

The crash diagnostic script writes to `/tmp/`:

```bash
./scripts/diagnose-cursor-crash.sh
# Report saved to /tmp/cursor-crash-report-*.txt
```

## 4. Backup Cursor History Before Reset

To save prompts/history locally before resetting (do NOT push — backup contains secrets):

```bash
./scripts/backup-cursor-state.sh
# Backup saved to .cursor-backup/ — keep locally only, never commit/push
```

## 5. Reset Cursor Data (Last Resort)

If crashes persist, reset Cursor (you’ll lose workspace state):

```bash
mv ~/Library/Application\ Support/Cursor ~/Library/Application\ Support/CursorBackup
```

Restart Cursor and re-open the project. **The workspace will work** — opening the folder again loads the project. You'll lose prompt history; the backup in `.cursor-backup` preserves it.

## 6. Report to Cursor

- [Forum](https://forum.cursor.com)
- [GitHub Issues](https://github.com/cursor/cursor/issues)

Include: macOS version (26.2), crash code 5, extension host logs.
