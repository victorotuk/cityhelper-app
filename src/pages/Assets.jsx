import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Package, Camera, Car, Cpu, MapPin } from 'lucide-react';
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

const MILEAGE_OPTIONS = [
  { id: 'manual', label: 'Manual only', desc: 'Enter odometer and trips yourself', icon: Car },
  { id: 'obd', label: 'OBD-II dongle', desc: 'Auto-read from Bluetooth OBD when in car', icon: Cpu },
  { id: 'gps_maps', label: 'GPS + Maps', desc: 'Detect trips by speed & road (no dongle)', icon: MapPin },
];

export default function Assets() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState([]);
  const [trips, setTrips] = useState([]);
  const [mileagePreference, setMileagePreference] = useState('manual');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [tripForm, setTripForm] = useState({ asset_id: '', distance_km: '', notes: '' });
  const [form, setForm] = useState({ name: '', description: '', category: 'other', value_estimate: '', location: '', notes: '', photo: null, current_mileage: '', last_mileage_update: '' });

  const vehicles = assets.filter(a => a.category === 'vehicle');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('mileage_trips').select('*, assets(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('user_settings').select('mileage_preference').eq('user_id', user.id).single(),
    ]).then(([assetsRes, tripsRes, settingsRes]) => {
      setAssets(assetsRes.data || []);
      setTrips(tripsRes.data || []);
      setMileagePreference(settingsRes?.data?.mileage_preference || 'manual');
    }).finally(() => setLoading(false));
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

  const saveMileagePreference = async (pref) => {
    setMileagePreference(pref);
    await supabase.from('user_settings').upsert(
      { user_id: user.id, mileage_preference: pref, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  };

  const handleAddTrip = async (e) => {
    e.preventDefault();
    if (!tripForm.asset_id || !tripForm.distance_km) return;
    const dist = parseFloat(tripForm.distance_km);
    if (isNaN(dist) || dist <= 0) return;
    const { error } = await supabase.from('mileage_trips').insert({
      user_id: user.id,
      asset_id: tripForm.asset_id,
      distance_km: dist,
      source: 'manual',
      notes: tripForm.notes?.trim() || null,
    });
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    setTripForm({ asset_id: '', distance_km: '', notes: '' });
    setShowAddTrip(false);
    const asset = assets.find(a => a.id === tripForm.asset_id);
    if (asset && asset.current_mileage != null) {
      await supabase.from('assets').update({
        current_mileage: (asset.current_mileage || 0) + Math.round(dist),
        last_mileage_update: new Date().toISOString().slice(0, 10),
      }).eq('id', tripForm.asset_id);
    }
    const { data } = await supabase.from('mileage_trips').select('*, assets(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    setTrips(data || []);
    const { data: assetsData } = await supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAssets(assetsData || []);
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
              {vehicles.length > 0 && (
                <div className="setting-card" style={{ marginBottom: 'var(--space-lg)' }}>
                  <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Mileage tracking</h3>
                  <p className="section-desc" style={{ marginBottom: 'var(--space-md)' }}>
                    How to track vehicle mileage. OBD-II uses a Bluetooth dongle; GPS+Maps detects trips by speed and road.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    {MILEAGE_OPTIONS.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <label key={opt.id} className="setting-header" style={{ cursor: 'pointer', alignItems: 'flex-start', padding: 'var(--space-md)', borderRadius: 8, border: mileagePreference === opt.id ? '2px solid var(--accent)' : '1px solid var(--border-subtle)' }}>
                          <input type="radio" name="mileage_pref" value={opt.id} checked={mileagePreference === opt.id} onChange={() => saveMileagePreference(opt.id)} style={{ marginTop: 4 }} />
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
                    <p className="section-desc" style={{ marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Auto tracking coming soon. Uses speed (&gt;15 mph = driving) and Snap to Roads to tell road vs sidewalk.
                    </p>
                  )}
                </div>
              )}

              {vehicles.length > 0 && (
                <div className="setting-card" style={{ marginBottom: 'var(--space-lg)' }}>
                  <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Trip log</h3>
                  {trips.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                      {trips.slice(0, 20).map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                          <div>
                            <strong>{t.assets?.name || 'Unknown'}</strong>
                            <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              {t.distance_km} km · {t.source === 'manual' ? 'Manual' : t.source === 'obd' ? 'OBD' : 'GPS'}
                            </span>
                          </div>
                          <small style={{ color: 'var(--text-muted)' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="section-desc" style={{ padding: 'var(--space-md)' }}>No trips yet.</p>
                  )}
                  {showAddTrip ? (
                    <form onSubmit={handleAddTrip} style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
                      <div className="form-group">
                        <label>Vehicle</label>
                        <select value={tripForm.asset_id} onChange={e => setTripForm(f => ({ ...f, asset_id: e.target.value }))} required>
                          <option value="">Select vehicle</option>
                          {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Distance (km)</label>
                        <input type="number" min="0.1" step="0.1" value={tripForm.distance_km} onChange={e => setTripForm(f => ({ ...f, distance_km: e.target.value }))} placeholder="e.g. 25.5" required />
                      </div>
                      <div className="form-group">
                        <label>Notes (optional)</label>
                        <input value={tripForm.notes} onChange={e => setTripForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Commute to office" />
                      </div>
                      <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" onClick={() => setShowAddTrip(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Add trip</button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" className="btn btn-ghost" style={{ marginTop: 'var(--space-sm)' }} onClick={() => setShowAddTrip(true)}>
                      <Plus size={16} /> Add trip
                    </button>
                  )}
                </div>
              )}

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
