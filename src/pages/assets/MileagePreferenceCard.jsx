import { Navigation } from 'lucide-react';
import { MILEAGE_OPTIONS } from './assetsConfig';

export default function MileagePreferenceCard({
  mileagePreference,
  saveMileagePreference,
  trackingActive,
}) {
  return (
    <div className="setting-card" style={{ marginBottom: 'var(--space-lg)' }}>
      <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Mileage tracking</h3>
      <p className="section-desc" style={{ marginBottom: 'var(--space-md)' }}>
        How to track vehicle mileage. OBD-II uses a Bluetooth dongle; GPS+Maps detects trips by speed and road.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {MILEAGE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <label
              key={opt.id}
              className="setting-header"
              style={{
                cursor: 'pointer',
                alignItems: 'flex-start',
                padding: 'var(--space-md)',
                borderRadius: 8,
                border: mileagePreference === opt.id ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
              }}
            >
              <input
                type="radio"
                name="mileage_pref"
                value={opt.id}
                checked={mileagePreference === opt.id}
                onChange={() => saveMileagePreference(opt.id)}
                style={{ marginTop: 4 }}
              />
              <div className="setting-icon active"><Icon size={20} /></div>
              <div className="setting-info" style={{ flex: 1 }}>
                <strong>{opt.label}</strong>
                <p className="section-desc" style={{ margin: 0, fontSize: '0.85rem' }}>{opt.desc}</p>
              </div>
            </label>
          );
        })}
      </div>
      {(mileagePreference === 'obd' || mileagePreference === 'gps_maps') && (
        <p
          className="section-desc"
          style={{
            marginTop: 'var(--space-md)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {trackingActive && <Navigation size={14} style={{ color: 'var(--accent)' }} />}
          {trackingActive
            ? 'GPS tracking active. Trips detected by speed (>15 mph).'
            : 'Allow location to track trips.'}
        </p>
      )}
    </div>
  );
}
