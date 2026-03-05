import { Bell, BellOff } from 'lucide-react';

export default function SettingsPushSection({
  pushEnabled,
  pushLoading,
  onEnable,
  onDisable,
}) {
  return (
    <section className="settings-section">
      <h2><Bell size={20} /> Push Notifications</h2>
      <p className="section-desc">Get reminded about upcoming deadlines on your device.</p>
      <div className="setting-card">
        <div className="setting-header">
          <div className={`setting-icon ${pushEnabled ? 'active' : 'muted'}`}>
            {pushEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </div>
          <div className="setting-info">
            <h3>{pushEnabled ? 'Notifications On' : 'Notifications Off'}</h3>
            <p>{pushEnabled ? "You'll get reminders before deadlines expire" : 'Turn on to get deadline reminders'}</p>
          </div>
          {pushEnabled ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onDisable} disabled={pushLoading}>
              {pushLoading ? 'Turning off...' : 'Turn Off'}
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" onClick={onEnable} disabled={pushLoading}>
              {pushLoading ? 'Enabling...' : 'Turn On'}
            </button>
          )}
        </div>
        {!pushEnabled && !pushLoading && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 16px 12px', margin: 0 }}>
            Your browser will ask for permission. If you previously blocked notifications,
            go to your browser settings &gt; Site Settings &gt; Notifications and allow this site.
          </p>
        )}
      </div>
    </section>
  );
}
