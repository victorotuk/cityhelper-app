export default function TripList({ trips }) {
  if (trips.length === 0) {
    return (
      <p className="section-desc" style={{ padding: 'var(--space-md)' }}>
        No trips yet. Drive with the app open to detect trips.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
      {trips.slice(0, 20).map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-sm) 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <strong>{t.assets?.name || 'Unassigned'}</strong>
            <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {t.distance_km} km · {t.source === 'obd' ? 'OBD' : 'GPS'}
            </span>
          </div>
          <small style={{ color: 'var(--text-muted)' }}>
            {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}
          </small>
        </div>
      ))}
    </div>
  );
}
