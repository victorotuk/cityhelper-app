import { useState } from 'react';
import { Download } from 'lucide-react';

/**
 * Shown only in the Tauri desktop app. Lets the user check for updates and install in place (no reinstall).
 */
export default function SettingsDesktopUpdatesSection() {
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleCheckForUpdates = async () => {
    if (typeof window === 'undefined' || !window.__TAURI__) return;
    setChecking(true);
    setMessage(null);
    setError(null);
    try {
      // Dynamic paths so Vite doesn't resolve these at web build time (Tauri-only packages)
      const updaterPath = '@tauri-apps/plugin-updater';
      const processPath = '@tauri-apps/plugin-process';
      const { check } = await import(/* @vite-ignore */ updaterPath);
      const { relaunch } = await import(/* @vite-ignore */ processPath);
      const update = await check();
      if (update) {
        setMessage(`Downloading ${update.version}…`);
        await update.downloadAndInstall();
        setMessage('Update installed. Restarting…');
        await relaunch();
      } else {
        setMessage('You’re on the latest version.');
      }
    } catch (err) {
      setError(err?.message || 'Could not check for updates.');
    } finally {
      setChecking(false);
    }
  };

  if (typeof window === 'undefined' || !window.__TAURI__) return null;

  return (
    <section className="settings-section">
      <h2>Desktop app updates</h2>
      <p className="section-desc">
        Check for a new version and update in place — no need to reinstall.
      </p>
      <div className="setting-row">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleCheckForUpdates}
          disabled={checking}
        >
          <Download size={16} />
          {checking ? 'Checking…' : 'Check for updates'}
        </button>
        {message && <span className="setting-hint">{message}</span>}
        {error && <span className="setting-hint text-error">{error}</span>}
      </div>
    </section>
  );
}
