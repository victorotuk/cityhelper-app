import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Package, Camera } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'property', label: 'Property' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'other', label: 'Other' },
];

export default function Assets() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'other', value_estimate: '', location: '', notes: '', photo: null, current_mileage: '', last_mileage_update: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setAssets(data || []))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    let photoUrl = null;
    if (form.photo && form.photo.size < 2 * 1024 * 1024) {
      const reader = new FileReader();
      photoUrl = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(form.photo);
      });
    }
    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      value_estimate: form.value_estimate.trim() || null,
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      photo_url: photoUrl,
    };
    if (form.category === 'vehicle' && form.current_mileage) {
      payload.current_mileage = parseInt(form.current_mileage, 10) || null;
      payload.last_mileage_update = form.last_mileage_update || new Date().toISOString().slice(0, 10);
    }
    const { error } = await supabase.from('assets').insert(payload);
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    setForm({ name: '', description: '', category: 'other', value_estimate: '', location: '', notes: '', photo: null, current_mileage: '', last_mileage_update: '' });
    setShowForm(false);
    const { data } = await supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAssets(data || []);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this asset?')) return;
    await supabase.from('assets').delete().eq('id', id);
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <Link to="/settings" className="back-btn"><ArrowLeft size={20} /> Back</Link>
        <div className="header-title"><Package size={24} /><span>Asset Inventory</span></div>
        <div style={{ width: 80 }} />
      </header>
      <main className="settings-main">
        <div className="settings-container">
          <p className="section-desc">Track your assets with photos and notes.</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <div className="setting-card">
                {assets.map(a => (
                  <div key={a.id} className="setting-header asset-card" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <div className="setting-icon active asset-icon">
                      {a.photo_url ? (
                        <img src={a.photo_url} alt={a.name} className="asset-photo-thumb" />
                      ) : (
                        <Package size={20} />
                      )}
                    </div>
                    <div className="setting-info">
                      <h3>{a.name}</h3>
                      <p>{CATEGORIES.find(c => c.id === a.category)?.label || a.category} {a.value_estimate && `· ${a.value_estimate}`} {a.category === 'vehicle' && a.current_mileage != null && `· ${a.current_mileage.toLocaleString()} km`}</p>
                      {a.location && <small style={{ color: 'var(--text-muted)' }}>{a.location}</small>}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)}><Trash2 size={16} /></button>
                  </div>
                ))}
                {assets.length === 0 && !showForm && (
                  <p className="section-desc" style={{ padding: 'var(--space-lg)' }}>No assets yet. Add one below.</p>
                )}
              </div>
              {showForm ? (
                <form onSubmit={handleSave} className="setting-card" style={{ padding: 'var(--space-lg)' }}>
                  <div className="form-group">
                    <label>Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. 2020 Honda Civic" required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Value (estimate)</label>
                    <input value={form.value_estimate} onChange={e => setForm(f => ({ ...f, value_estimate: e.target.value }))} placeholder="e.g. $25,000" />
                  </div>
                  {form.category === 'vehicle' && (
                    <>
                      <div className="form-group">
                        <label>Current mileage (km)</label>
                        <input type="number" min="0" value={form.current_mileage} onChange={e => setForm(f => ({ ...f, current_mileage: e.target.value }))} placeholder="e.g. 45000" />
                      </div>
                      <div className="form-group">
                        <label>Last mileage update</label>
                        <input type="date" value={form.last_mileage_update} onChange={e => setForm(f => ({ ...f, last_mileage_update: e.target.value }))} />
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label>Location</label>
                    <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Where is it stored?" />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Serial number, condition, etc." rows={2} />
                  </div>
                  <div className="form-group">
                    <label>Photo (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setForm(f => ({ ...f, photo: e.target.files?.[0] || null }))}
                    />
                    {form.photo && <p className="section-desc" style={{ fontSize: '12px', marginTop: '4px' }}><Camera size={12} /> {form.photo.name} (max 2MB)</p>}
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save</button>
                  </div>
                </form>
              ) : (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  <Plus size={18} /> Add Asset
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
