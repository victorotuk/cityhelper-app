import { Mail } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsDigestSection({
  digestEnabled,
  digestDay,
  setDigestEnabled,
  setDigestDay,
  saveSettings,
}) {
  return (
    <section className="settings-section">
      <h2><Mail size={20} /> Weekly Digest</h2>
      <p className="section-desc">Get a weekly email summary of your upcoming deadlines.</p>
      <div className="setting-card">
        <div className="setting-header">
          <div className={`setting-icon ${digestEnabled ? 'active' : 'muted'}`}>
            <Mail size={20} />
          </div>
          <div className="setting-info">
            <h3>{digestEnabled ? 'Digest On' : 'Digest Off'}</h3>
            <p>{digestEnabled ? `Sent every ${DAYS[digestDay]}` : 'Turn on for a weekly summary'}</p>
          </div>
          <button
            type="button"
            className={`btn btn-sm ${digestEnabled ? 'btn-ghost' : 'btn-primary'}`}
            onClick={async () => {
              const next = !digestEnabled;
              setDigestEnabled(next);
              await saveSettings({ digest_email_enabled: next, digest_day: digestDay });
            }}
          >
            {digestEnabled ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
        {digestEnabled && (
          <div className="setting-details" style={{ padding: '12px 16px' }}>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>Send on</label>
            <select
              value={digestDay}
              onChange={async (e) => {
                const d = Number(e.target.value);
                setDigestDay(d);
                await saveSettings({ digest_email_enabled: true, digest_day: d });
              }}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
            >
              {DAYS.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </section>
  );
}
