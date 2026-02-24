import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const ROLES = [
  { id: 'executor', label: 'Executor' },
  { id: 'nominee', label: 'Nominee' },
  { id: 'trustee', label: 'Trustee' },
  { id: 'power_of_attorney', label: 'Power of Attorney' },
];

export default function Estate() {
  const { user } = useAuthStore();
  const [executors, setExecutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'executor', notes: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('estate_executors')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setExecutors(data || []))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const { error } = await supabase.from('estate_executors').insert({
      user_id: user.id,
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role,
      notes: form.notes.trim() || null,
    });
    if (error) {
      alert('Error: ' + error.message);
      return;
    }
    setForm({ name: '', email: '', phone: '', role: 'executor', notes: '' });
    setShowForm(false);
    setExecutors(prev => [{ ...form, name: form.name.trim(), id: 'new' }, ...prev]);
    const { data } = await supabase.from('estate_executors').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setExecutors(data || []);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this person?')) return;
    await supabase.from('estate_executors').delete().eq('id', id);
    setExecutors(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <Link to="/settings" className="back-btn"><ArrowLeft size={20} /> Back</Link>
        <div className="header-title"><User size={24} /><span>Estate Executors & Nominees</span></div>
        <div style={{ width: 80 }} />
      </header>
      <main className="settings-main">
        <div className="settings-container">
          <p className="section-desc">Manage executors, nominees, trustees, and power of attorney for your estate planning.</p>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <div className="setting-card">
                {executors.map(e => (
                  <div key={e.id} className="setting-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <div className="setting-icon active"><User size={20} /></div>
                    <div className="setting-info">
                      <h3>{e.name}</h3>
                      <p>{ROLES.find(r => r.id === e.role)?.label || e.role} {e.email && `· ${e.email}`}</p>
                      {e.notes && <small style={{ color: 'var(--text-muted)' }}>{e.notes}</small>}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(e.id)}><Trash2 size={16} /></button>
                  </div>
                ))}
                {executors.length === 0 && !showForm && (
                  <p className="section-desc" style={{ padding: 'var(--space-lg)' }}>No executors or nominees yet. Add one below.</p>
                )}
              </div>
              {showForm ? (
                <form onSubmit={handleSave} className="setting-card" style={{ padding: 'var(--space-lg)' }}>
                  <div className="form-group">
                    <label>Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" rows={2} />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save</button>
                  </div>
                </form>
              ) : (
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  <Plus size={18} /> Add Executor / Nominee
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
