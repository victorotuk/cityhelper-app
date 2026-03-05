import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

export default function SettingsAppearanceSection() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <section className="settings-section">
      <h2>Appearance</h2>
      <p className="section-desc">
        Choose light or dark mode for the app. Your choice is saved.
      </p>
      <div className="setting-card">
        <div className="setting-header">
          <div className={`setting-icon ${theme === 'light' ? 'active' : 'muted'}`}>
            <Sun size={20} />
          </div>
          <div className="setting-info">
            <h3>Light</h3>
            <p>Lighter background, easier on the eyes in bright environments</p>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTheme('light')}
          >
            Light
          </button>
        </div>
        <div className="setting-header">
          <div className={`setting-icon ${theme === 'dark' ? 'active' : 'muted'}`}>
            <Moon size={20} />
          </div>
          <div className="setting-info">
            <h3>Dark</h3>
            <p>Dark background, comfortable in low light</p>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTheme('dark')}
          >
            Dark
          </button>
        </div>
      </div>
    </section>
  );
}
