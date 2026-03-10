# Desktop app updates (Tauri)

The Nava desktop app uses Tauri's built-in updater so users can **update in place** — no reinstall.

## App icon (dock / Applications)

The desktop app icon uses the **light (cream bubble)** logo so it’s visible in the macOS dock and Applications. Icons are in `src-tauri/icons/`. To regenerate from the light logo:

```bash
npx tauri icon public/nava-logo-light.png
```

After changing icons, rebuild the app (or run `npm run tauri:dev`). If the dock still shows the old icon, quit Nava, remove it from the dock, open it again from Applications, then re-add to dock. The app **auto-checks on startup** (prompts user via `confirm()`) and users can also manually check via **Settings → Check for updates**.

## Signing keys (already set up)

Keys live at:
- **Private:** `~/.tauri/nava.key` — never commit, never share
- **Public:** `~/.tauri/nava.key.pub` — already embedded in `src-tauri/tauri.conf.json` → `plugins.updater.pubkey`

If you need to regenerate (e.g. new machine), run:

```bash
CI=false npx tauri signer generate -w ~/.tauri/nava.key -p "" -f
```

Then update the `pubkey` in `tauri.conf.json` with the contents of `~/.tauri/nava.key.pub`.

## Publishing a new version

### Quick way (recommended)

```bash
npm run release -- 0.2.0
```

This script (`scripts/release.sh`):
1. Bumps version in `package.json` and `tauri.conf.json`
2. Builds a signed desktop app (reads `~/.tauri/nava.key` automatically)
3. Generates `latest.json` in the project root
4. Prints exact instructions for creating the GitHub Release

### Manual way

1. Bump version in **two** places:
   - `package.json` → `version`
   - `src-tauri/tauri.conf.json` → `version`

2. Build with the private key:

   ```bash
   export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/nava.key)"
   export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
   CI=false npm run tauri:build
   ```

   Output:
   - **macOS:** `bundle/macos/Nava.app.tar.gz` + `.sig`, `bundle/dmg/Nava_<ver>_aarch64.dmg`
   - **Windows:** `bundle/msi/*.msi` + `.sig`, `bundle/nsis/*.exe` + `.sig`
   - **Linux:** `bundle/appimage/*.AppImage` + `.sig`

3. Create a **GitHub Release** (e.g. tag `v0.2.0`):

   ```bash
   gh release create v0.2.0 --title 'v0.2.0' \
     Nava_0.2.0_aarch64.dmg Nava.app.tar.gz latest.json
   ```

4. The `latest.json` format:

   ```json
   {
     "version": "0.2.0",
     "notes": "Release notes here",
     "pub_date": "2026-03-07T00:00:00Z",
     "platforms": {
       "darwin-aarch64": {
         "signature": "<contents of Nava.app.tar.gz.sig>",
         "url": "https://github.com/victorotuk/cityhelper-app/releases/download/v0.2.0/Nava.app.tar.gz"
       }
     }
   }
   ```

   The release script generates this automatically.

## How users get updates

1. **On startup:** App calls `check()` from `@tauri-apps/plugin-updater`. If a new version exists at the GitHub Releases endpoint, a `confirm()` dialog asks to update. User clicks OK → download, install, relaunch. All automatic.
2. **Manual:** Settings → Check for updates → same flow.
3. After restart, they're on the new version — no reinstall.

## CI builds (GitHub Actions)

The `.github/workflows/tauri-build.yml` workflow builds for macOS, Windows, and Linux on every push to `main`. To produce **signed** artifacts in CI, add the `TAURI_SIGNING_PRIVATE_KEY` secret to your GitHub repo:

1. Go to GitHub → repo → Settings → Secrets and variables → Actions
2. Add `TAURI_SIGNING_PRIVATE_KEY` with the contents of `~/.tauri/nava.key`
3. The workflow already passes this secret as an env var

## Config reference

- **`tauri.conf.json`**
  - `bundle.createUpdaterArtifacts: true` — produces `.tar.gz` + `.sig`
  - `plugins.updater.pubkey` — the public key (already set)
  - `plugins.updater.endpoints` — `[".../releases/latest/download/latest.json"]`
  - `plugins.updater.dialog: true` — built-in Tauri dialog (in addition to our `confirm()` on startup)
- **`src-tauri/capabilities/default.json`** — `updater:default` and `process:default` permissions
- **`src/lib/desktopUpdater.js`** — startup auto-check logic
- **`src/components/settings/SettingsDesktopUpdatesSection.jsx`** — manual check UI
- **`scripts/release.sh`** — one-command release workflow
