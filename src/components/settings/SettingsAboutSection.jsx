import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';
import { APP_VERSION } from '../../lib/version';

/**
 * Shows app name, version, and platform. Version from Tauri (desktop) or version.js (web).
 */
export default function SettingsAboutSection() {
  const [version, setVersion] = useState(APP_VERSION);
  const [platform, setPlatform] = useState('web');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__TAURI__) {
      setPlatform('desktop');
      import('@tauri-apps/api/app')
        .then(({ getVersion }) => getVersion())
        .then(setVersion)
        .catch(() => setVersion(APP_VERSION));
    } else {
      setPlatform('web');
    }
  }, []);

  return (
    <section className="settings-section">
      <h2>About</h2>
      <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Info size={18} style={{ opacity: 0.7 }} />
          <span>{APP_CONFIG.formalName || APP_CONFIG.name}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Version {version ?? '…'} · {platform}
        </div>
      </div>
    </section>
  );
}
