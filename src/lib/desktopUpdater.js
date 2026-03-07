/**
 * Checks for desktop app updates on startup (Tauri only).
 * If an update is found, downloads, installs, and relaunches the app.
 * Silently no-ops on web or if no update is available.
 */
export async function checkForAppUpdate() {
  if (typeof window === 'undefined' || !window.__TAURI__) return;

  try {
    const updaterPath = '@tauri-apps/plugin-updater';
    const processPath = '@tauri-apps/plugin-process';
    const { check } = await import(/* @vite-ignore */ updaterPath);
    const { relaunch } = await import(/* @vite-ignore */ processPath);

    const update = await check();
    if (!update) return;

    const yes = window.confirm(
      `A new version (${update.version}) is available.\n\nUpdate now? The app will restart automatically.`
    );
    if (!yes) return;

    await update.downloadAndInstall();
    await relaunch();
  } catch {
    // Silent fail on startup — user can still update from Settings
  }
}
