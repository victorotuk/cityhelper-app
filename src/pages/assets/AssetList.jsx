import { Package, Trash2 } from 'lucide-react';
import { CATEGORIES } from './assetsConfig';

export default function AssetList({ assets, onDelete }) {
  return (
    <div className="setting-card">
      {assets.map((a) => (
        <div
          key={a.id}
          className="setting-header asset-card"
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <div className="setting-icon active asset-icon">
            {a.photo_url ? (
              <img src={a.photo_url} alt={a.name} className="asset-photo-thumb" />
            ) : (
              <Package size={20} />
            )}
          </div>
          <div className="setting-info">
            <h3>{a.name}</h3>
            <p>
              {CATEGORIES.find((c) => c.id === a.category)?.label || a.category}
              {a.value_estimate && ` · ${a.value_estimate}`}
              {a.category === 'vehicle' && a.current_mileage != null && ` · ${a.current_mileage.toLocaleString()} km`}
            </p>
            {a.location && <small style={{ color: 'var(--text-muted)' }}>{a.location}</small>}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onDelete(a.id)}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      {assets.length === 0 && (
        <p className="section-desc" style={{ padding: 'var(--space-lg)' }}>
          No assets yet. Add one below.
        </p>
      )}
    </div>
  );
}
