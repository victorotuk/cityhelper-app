import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Building2, MapPin } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const ENTITY_TYPES = [
  { id: 'corporation', label: 'Corporation' },
  { id: 'llc', label: 'LLC' },
  { id: 'partnership', label: 'Partnership' },
  { id: 'sole_proprietor', label: 'Sole Proprietor' },
  { id: 'nonprofit', label: 'Nonprofit' },
];

export default function Business() {
  const { user } = useAuthStore();
  const [entities, setEntities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [entityForm, setEntityForm] = useState({ name: '', entity_type: 'corporation', registration_number: '', jurisdiction: '', notes: '' });
  const [locationForm, setLocationForm] = useState({ name: '', address: '', city: '', province_state: '', postal_code: '', country: 'ca', entity_id: '', is_primary: false });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('business_entities').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('business_locations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([e, l]) => {
      setEntities(e.data || []);
      setLocations(l.data || []);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSaveEntity = async (e) => {
    e.preventDefault();
    if (!entityForm.name.trim()) return;
    const { error } = await supabase.from('business_entities').insert({
      user_id: user.id,
      name: entityForm.name.trim(),
      entity_type: entityForm.entity_type,
      registration_number: entityForm.registration_number.trim() || null,
      jurisdiction: entityForm.jurisdiction.trim() || null,
      notes: entityForm.notes.trim() || null,
    });
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    setEntityForm({ name: '', entity_type: 'corporation', registration_number: '', jurisdiction: '', notes: '' });
    setShowEntityForm(false);
    const { data } = await supabase.from('business_entities').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setEntities(data || []);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!locationForm.name.trim()) return;
    const { error } = await supabase.from('business_locations').insert({
      user_id: user.id,
      entity_id: locationForm.entity_id || null,
      name: locationForm.name.trim(),
      address: locationForm.address.trim() || null,
      city: locationForm.city.trim() || null,
      province_state: locationForm.province_state.trim() || null,
      postal_code: locationForm.postal_code.trim() || null,
      country: locationForm.country,
      is_primary: locationForm.is_primary,
    });
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    setLocationForm({ name: '', address: '', city: '', province_state: '', postal_code: '', country: 'ca', entity_id: '', is_primary: false });
    setShowLocationForm(false);
    const { data } = await supabase.from('business_locations').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setLocations(data || []);
  };

  const handleDeleteEntity = async (id) => {
    if (!confirm('Delete this entity and its locations?')) return;
    await supabase.from('business_entities').delete().eq('id', id);
    setEntities(prev => prev.filter(e => e.id !== id));
    setLocations(prev => prev.filter(l => l.entity_id !== id));
  };

  const handleDeleteLocation = async (id) => {
    if (!confirm('Remove this location?')) return;
    await supabase.from('business_locations').delete().eq('id', id);
    setLocations(prev => prev.filter(l => l.id !== id));
  };

  const getEntityName = (id) => entities.find(e => e.id === id)?.name || '—';

  return (
    <div className="settings-page">
      <header className="page-header">
        <Link to="/settings" className="back-btn"><ArrowLeft size={20} /> Back</Link>
        <div className="header-title"><Building2 size={24} /><span>Business Entities & Locations</span></div>
        <div style={{ width: 80 }} />
      </header>
      <main className="settings-main">
        <div className="settings-container">
          <p className="section-desc">Manage your business entities and their locations for compliance tracking.</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <section className="settings-section">
                <h2><Building2 size={20} /> Entities</h2>
                <div className="setting-card">
                  {entities.map(ent => (
                    <div key={ent.id} className="setting-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                      <div className="setting-icon active"><Building2 size={20} /></div>
                      <div className="setting-info">
                        <h3>{ent.name}</h3>
                        <p>{ENTITY_TYPES.find(t => t.id === ent.entity_type)?.label || ent.entity_type} {ent.registration_number && `· ${ent.registration_number}`}</p>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteEntity(ent.id)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {entities.length === 0 && !showEntityForm && <p className="section-desc" style={{ padding: 'var(--space-md)' }}>No entities yet.</p>}
                </div>
                {showEntityForm ? (
                  <form onSubmit={handleSaveEntity} className="setting-card" style={{ padding: 'var(--space-lg)' }}>
                    <div className="form-group">
                      <label>Entity name *</label>
                      <input value={entityForm.name} onChange={e => setEntityForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Corp" required />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select value={entityForm.entity_type} onChange={e => setEntityForm(f => ({ ...f, entity_type: e.target.value }))}>
                        {ENTITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Registration #</label>
                      <input value={entityForm.registration_number} onChange={e => setEntityForm(f => ({ ...f, registration_number: e.target.value }))} placeholder="Optional" />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => setShowEntityForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Save</button>
                    </div>
                  </form>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowEntityForm(true)}><Plus size={16} /> Add Entity</button>
                )}
              </section>

              <section className="settings-section">
                <h2><MapPin size={20} /> Locations</h2>
                <div className="setting-card">
                  {locations.map(loc => (
                    <div key={loc.id} className="setting-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                      <div className="setting-icon active"><MapPin size={20} /></div>
                      <div className="setting-info">
                        <h3>{loc.name} {loc.is_primary && <span className="badge-optional">Primary</span>}</h3>
                        <p>{[loc.address, loc.city, loc.province_state].filter(Boolean).join(', ')} {getEntityName(loc.entity_id)}</p>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteLocation(loc.id)}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {locations.length === 0 && !showLocationForm && <p className="section-desc" style={{ padding: 'var(--space-md)' }}>No locations yet.</p>}
                </div>
                {showLocationForm ? (
                  <form onSubmit={handleSaveLocation} className="setting-card" style={{ padding: 'var(--space-lg)' }}>
                    <div className="form-group">
                      <label>Location name *</label>
                      <input value={locationForm.name} onChange={e => setLocationForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Office" required />
                    </div>
                    <div className="form-group">
                      <label>Entity</label>
                      <select value={locationForm.entity_id} onChange={e => setLocationForm(f => ({ ...f, entity_id: e.target.value || null }))}>
                        <option value="">— None —</option>
                        {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <input value={locationForm.address} onChange={e => setLocationForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address" />
                    </div>
                    <div className="form-group" style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                      <input value={locationForm.city} onChange={e => setLocationForm(f => ({ ...f, city: e.target.value }))} placeholder="City" style={{ flex: 1 }} />
                      <input value={locationForm.province_state} onChange={e => setLocationForm(f => ({ ...f, province_state: e.target.value }))} placeholder="Prov/State" style={{ width: '100px' }} />
                      <input value={locationForm.postal_code} onChange={e => setLocationForm(f => ({ ...f, postal_code: e.target.value }))} placeholder="Postal" style={{ width: '90px' }} />
                    </div>
                    <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" checked={locationForm.is_primary} onChange={e => setLocationForm(f => ({ ...f, is_primary: e.target.checked }))} />
                      <span>Primary location</span>
                    </label>
                    <div className="modal-actions">
                      <button type="button" className="btn btn-ghost" onClick={() => setShowLocationForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Save</button>
                    </div>
                  </form>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowLocationForm(true)}><Plus size={16} /> Add Location</button>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
