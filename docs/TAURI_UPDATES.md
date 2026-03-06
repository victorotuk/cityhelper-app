# Desktop app updates (Tauri)

The Nava desktop app uses Tauri’s built-in updater so users can **update in place** — no reinstall. They use **Settings → Check for updates** (or you can trigger a check on startup later).

## One-time setup: signing keys

1. Generate a key pair (do this once, keep the private key safe):

   ```bash
   npm run tauri signer generate -- -w ~/.tauri/nava.key
   ```

   This creates:
   - `~/.tauri/nava.key` (private — never commit, never share)
   - Prints the **public key** to the terminal

2. Put the **public key** in `src-tauri/tauri.conf.json`:

   - Open `tauri.conf.json` and find `plugins.updater.pubkey`.
   - Replace `REPLACE_AFTER_RUNNING_tauri_signer_generate` with the full public key content (the long string from the CLI output).

3. For **building** signed update artifacts, set the private key when you build:

   ```bash
   export TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.tauri/nava.key)"
   # optional if key has a password:
   # export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="your-password"
   CI=false npm run tauri:build
   ```

   Build output will include update bundles (e.g. `Nava.app.tar.gz` + `Nava.app.tar.gz.sig` on macOS) in `src-tauri/target/release/bundle/`.

## Publishing a new version

1. Bump version in **two** places:
   - `package.json` → `version`
   - `src-tauri/tauri.conf.json` → top-level `"version"` (e.g. `"0.1.1"`).

2. Build with the private key (see above). After the build you’ll have:
   - **macOS:** `src-tauri/target/release/bundle/macos/Nava.app.tar.gz` and `Nava.app.tar.gz.sig`
   - **Windows:** `.msi` / `.exe` and `.sig` in `bundle/msi` and `bundle/nsis`
   - **Linux:** `.AppImage` and `.AppImage.sig` in `bundle/appimage`

3. Create a **GitHub Release** (e.g. tag `v0.1.1`):
   - Upload the installer(s) you want to distribute (e.g. `Nava.app.tar.gz` for macOS, or the `.dmg` for first-time installs).
   - Upload the **update** artifacts: for each platform, upload the `.tar.gz` (macOS), `.msi`/`.exe` (Windows), `.AppImage` (Linux) and their `.sig` files.

4. Add a **`latest.json`** asset to the release so the app can find the update. Format:

   ```json
   {
     "version": "0.1.1",
     "notes": "Optional release notes",
     "pub_date": "2026-03-06T12:00:00Z",
     "platforms": {
       "darwin-aarch64": {
         "signature": "<contents of Nava.app.tar.gz.sig>",
         "url": "https://github.com/victorotuk/cityhelper-app/releases/download/v0.1.1/Nava.app.tar.gz"
       },
       "darwin-x86_64": { "signature": "...", "url": "..." },
       "windows-x86_64": { "signature": "...", "url": "..." },
       "linux-x86_64": { "signature": "...", "url": "..." }
     }
   }
   ```

   - `signature`: paste the **entire contents** of the `.sig` file (not a path).
   - `url`: direct download URL to the `.tar.gz`, `.msi`, `.exe`, or `.AppImage` on the same release.

5. The app is configured to look at:
   `https://github.com/victorotuk/cityhelper-app/releases/latest/download/latest.json`

   So either:
   - Name the asset **exactly** `latest.json` and it will be served at that URL for the **latest** release, or
   - Use a **redirect** or a small script that copies `latest.json` to that path for the latest release.

   Easiest: upload a file named `latest.json` to each release; the “latest” in the URL refers to the **release** tagged as latest on GitHub. So when you mark release `v0.1.1` as latest, `.../releases/latest/download/latest.json` will serve that release’s `latest.json`.

## User flow

1. User opens the desktop app → **Settings**.
2. They click **Check for updates**.
3. If an update is available, the app downloads it, installs it, and restarts (Tauri’s default dialog can be used; it’s enabled in config).
4. After restart, they’re on the new version — no reinstall, no deleting the old app.

## Config reference

- **tauri.conf.json**
  - `bundle.createUpdaterArtifacts: true` — build produces update bundles and `.sig` files.
  - `plugins.updater` — `pubkey`, `endpoints` (e.g. GitHub `latest.json`), `dialog: true` for the built-in prompt.
- **Capabilities:** `updater:default` and `process:default` are enabled so the frontend can check, download, install, and relaunch.
