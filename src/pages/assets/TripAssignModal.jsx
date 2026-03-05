export default function TripAssignModal({ pendingTrip, assignVehicle, setAssignVehicle, vehicles, onAssign, onDismiss }) {
  if (!pendingTrip) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div className="setting-card" style={{ maxWidth: 360, width: '100%', padding: 'var(--space-lg)' }}>
        <h3 style={{ marginBottom: 'var(--space-sm)' }}>Trip detected</h3>
        <p className="section-desc" style={{ marginBottom: 'var(--space-md)' }}>
          {pendingTrip.distance_km} km · Assign to vehicle?
        </p>
        <form onSubmit={onAssign}>
          <div className="form-group">
            <label>Vehicle</label>
            <select value={assignVehicle} onChange={(e) => setAssignVehicle(e.target.value)}>
              <option value="">Skip (save without vehicle)</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onDismiss}>
              Dismiss
            </button>
            <button type="submit" className="btn btn-primary">
              Save trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
