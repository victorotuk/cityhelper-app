import { Smartphone } from 'lucide-react';

export default function SettingsNotificationSuggestionsSection({
  enabled,
  setEnabled,
  saveSettings,
}) {
  return (
    <section className="settings-section">
      <h2><Smartphone size={20} /> Notification Suggestions</h2>
      <p className="section-desc">When enabled, Nava can suggest adding items when it detects relevant dates in your notifications (e.g. parking tickets, renewal reminders). All processing happens on-device.</p>
      <div className="setting-card">
        <div className="setting-header">
          <div className={`setting-icon ${enabled ? 'active' : 'muted'}`}>
            <Smartphone size={20} />
          </div>
          <div className="setting-info">
            <h3>{enabled ? 'Suggestions On' : 'Suggestions Off'}</h3>
            <p>{enabled ? "We'll suggest tracking when we detect dates in notifications" : 'Turn on to get suggestions from parking, renewals, bills, etc.'}</p>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${enabled ? 'btn-ghost' : 'btn-primary'}`}
            onClick={async () => {
              const next = !enabled;
              setEnabled(next);
              await saveSettings({ notification_suggestions_enabled: next });
            }}
          >
            {enabled ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 16px 12px', margin: 0 }}>
          Requires &quot;Notification access&quot; in Android Settings → Apps → Nava → Notifications. A compatible plugin is needed for full support.
        </p>
      </div>
    </section>
  );
}
