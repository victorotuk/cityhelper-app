import { Package, Camera } from 'lucide-react';
import { CATEGORIES } from './assetsConfig';

export default function AssetForm({ form, setForm, onSave, onCancel }) {
  return (
    <form onSubmit={onSave} className="setting-card" style={{ padding: 'var(--space-lg)' }}>
      <div className="form-group">
        <label>Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. 2020 Honda Civic"
          required
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <input
          value={form.description || ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Short description"
        />
      </div>
      <div className="form-group">
        <label>Category</label>
        <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Value (estimate)</label>
        <input
          value={form.value_estimate}
          onChange={(e) => setForm((f) => ({ ...f, value_estimate: e.target.value }))}
          placeholder="e.g. $25,000"
        />
      </div>
      {form.category === 'vehicle' && (
        <>
          <div className="form-group">
            <label>Current mileage (km)</label>
            <input
              type="number"
              min="0"
              value={form.current_mileage}
              onChange={(e) => setForm((f) => ({ ...f, current_mileage: e.target.value }))}
              placeholder="e.g. 45000"
            />
          </div>
          <div className="form-group">
            <label>Last mileage update</label>
            <input
              type="date"
              value={form.last_mileage_update}
              onChange={(e) => setForm((f) => ({ ...f, last_mileage_update: e.target.value }))}
            />
          </div>
        </>
      )}
      <div className="form-group">
        <label>Location</label>
        <input
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          placeholder="Where is it stored?"
        />
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Serial number, condition, etc."
          rows={2}
        />
      </div>
      <div className="form-group">
        <label>Photo (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setForm((f) => ({ ...f, photo: e.target.files?.[0] || null }))}
        />
        {form.photo && (
          <p className="section-desc" style={{ fontSize: '12px', marginTop: '4px' }}>
            <Camera size={12} /> {form.photo.name} (max 2MB)
          </p>
        )}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}
