# Data You Can Safely Delete

After updating the necessary files and flows, these can be removed to free space and reduce Cursor indexing.

---

## In This Repo

| Path | Reason | Regenerate With |
|------|--------|-----------------|
| `cursor-crash-report-*.txt` | One-off diagnostic reports | `./scripts/diagnose-cursor-crash.sh` (creates new ones) |
| `android/app/build/` | Android build output | `npx cap sync` + Android Studio build |
| `android/app/src/main/assets/public/` | Capacitor web assets copy | `npx cap sync` |
| `ios/App/App/public/` | Capacitor web assets (iOS) | `npx cap sync` |
| `dist/` | Vite production build | `npm run build` |
| `node_modules/` | Dependencies | `npm install` |

---

## Outside Repo (System)

| Path | Reason |
|------|--------|
| `~/Library/Application Support/Cursor/logs/` | Old Cursor logs (keep recent if debugging) |
| `~/Library/Logs/DiagnosticReports/*Cursor*` | macOS crash reports |
| `~/Library/Application Support/Cursor/User/workspaceStorage/*/state.vscdb` | Workspace state (prompts, etc.) — only delete if resetting Cursor |

---

## Before Deleting Build Artifacts

1. **Android:** Ensure `capacitor.config.json` points to correct `webDir` (usually `dist`).
2. **iOS:** Same.
3. After delete: run `npm run build` then `npx cap sync` to repopulate.

---

## .cursorignore Additions (Manual)

If Cursor indexes too much, add to `.cursorignore`:

```
package-lock.json
cursor-crash-report-*.txt
android/app/build
android/app/src/main/assets/public
ios/App/App/public
```

---

## Cursor Data Reset (If Crashes Persist)

```bash
mv ~/Library/Application\ Support/Cursor ~/Library/Application\ Support/CursorBackup
```

Restart Cursor. You'll lose workspace state; re-add project.
