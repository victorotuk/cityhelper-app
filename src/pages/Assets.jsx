import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, Plus, Trash2, Package, Camera, Cpu, MapPin, Navigation } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { requestLocationPermission, createMileageTracker } from '../lib/mileageTracking';

const isNative = Capacitor.getPlatform() !== 'web';

const CATEGORIES = [
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'property', label: 'Property' },
  { id: 'jewelry', label: 'Jewelry' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'other', label: 'Other' },
];

const MILEAGE_OPTIONS = [
  { id: 'obd', label: 'OBD-II dongle', desc: 'Auto-read from Bluetooth OBD when in car (GPS fallback)', icon: Cpu },
  { id: 'gps_maps', label: 'GPS + Maps', desc: 'Detect trips by speed & road (no dongle)', icon: MapPin },
];

export default function Assets() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState([]);
  const [trips, setTrips] = useState([]);
  const [mileagePreference, setMileagePreference] = useState('gps_maps');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [pendingTrip, setPendingTrip] = useState(null);
  const [assignVehicle, setAssignVehicle] = useState('');
  const trackerRef = useRef(null);
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
      setMileagePreference(settingsRes?.data?.mileage_preference || 'gps_maps');
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

  useEffect(() => {
    if (!isNative || !user || !vehicles.length) return;
    const useGps = mileagePreference === 'gps_maps' || mileagePreference === 'obd';
    if (!useGps) return;

    const tracker = createMileageTracker({
      onTripEnd: (trip) => setPendingTrip(trip),
      onError: (e) => console.warn('[Mileage]', e),
    });
    trackerRef.current = tracker;

    let mounted = true;
    requestLocationPermission().then((ok) => {
      if (!mounted || !ok) return;
      tracker.start().then(() => setTrackingActive(true));
    });
    return () => {
      mounted = false;
      tracker.stop().then(() => setTrackingActive(false));
      trackerRef.current = null;
    };
  }, [user, vehicles.length, mileagePreference]);

  const handleAssignTrip = async (e) => {
    e.preventDefault();
    if (!pendingTrip) return;
    const assetId = assignVehicle || null;
    const { error } = await supabase.from('mileage_trips').insert({
      user_id: user.id,
      asset_id: assetId,
      distance_km: pendingTrip.distance_km,
      source: mileagePreference === 'obd' ? 'obd' : 'gps_maps',
      start_time: pendingTrip.start_time,
      end_time: pendingTrip.end_time,
      start_lat: pendingTrip.start_lat,
      start_lng: pendingTrip.start_lng,
      end_lat: pendingTrip.end_lat,
      end_lng: pendingTrip.end_lng,
    });
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    if (assetId) {
      const asset = assets.find(a => a.id === assetId);
      if (asset && asset.current_mileage != null) {
        await supabase.from('assets').update({
          current_mileage: (asset.current_mileage || 0) + Math.round(pendingTrip.distance_km),
          last_mileage_update: new Date().toISOString().slice(0, 10),
        }).eq('id', assetId);
      }
    }
    setPendingTrip(null);
    setAssignVehicle('');
    const { data } = await supabase.from('mileage_trips').select('*, assets(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    setTrips(data || []);
    const { data: assetsData } = await supabase.from('assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAssets(assetsData || []);
  };

  const dismissTrip = () => {
    setPendingTrip(null);
    setAssignVehicle('');
  };

  return (
    <div className="settings-page">
      {pendingTrip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="setting-card" style={{ maxWidth: 360, width: '100%', padding: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-sm)' }}>Trip detected</h3>
            <p className="section-desc" style={{ marginBottom: 'var(--space-md)' }}>
              {pendingTrip.distance_km} km · Assign to vehicle?
            </p>
            <form onSubmit={handleAssignTrip}>
              <div className="form-group">
                <label>Vehicle</label>
                <select value={assignVehicle} onChange={e => setAssignVehicle(e.target.value)}>
                  <option value="">Skip (save without vehicle)</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={dismissTrip}>Dismiss</button>
                <button type="submit" className="btn btn-primary">Save trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
              {isNative && vehicles.length > 0 && (
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
                    <p className="section-desc" style={{ marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {trackingActive && <Navigation size={14} style={{ color: 'var(--accent)' }} />}
                      {trackingActive ? 'GPS tracking active. Trips detected by speed (&gt;15 mph).' : 'Allow location to track trips.'}
                    </p>
                  )}
                </div>
              )}

              {isNative && vehicles.length > 0 && (
                <div className="setting-card" style={{ marginBottom: 'var(--space-lg)' }}>
                  <h3 style={{ marginBottom: 'var(--space-sm)', fontSize: '1rem' }}>Trip log</h3>
                  {trips.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                      {trips.slice(0, 20).map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--border-subtle)' }}>
                          <div>
                            <strong>{t.assets?.name || 'Unassigned'}</strong>
                            <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              {t.distance_km} km · {t.source === 'obd' ? 'OBD' : 'GPS'}
                            </span>
                          </div>
                          <small style={{ color: 'var(--text-muted)' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="section-desc" style={{ padding: 'var(--space-md)' }}>No trips yet. Drive with the app open to detect trips.</p>
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
