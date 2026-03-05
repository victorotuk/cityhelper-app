import { useState } from 'react';
import { X, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ShareItemModal({ item, onClose, onShared }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke('share-item', {
        body: { itemId: item.id, email: trimmed },
      });
      if (err) throw new Error(err.message || err);
      if (data?.error) throw new Error(data.error);
      setSuccess(true);
      onShared?.();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Share2 size={20} /> Share &quot;{item?.name}&quot;</h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {success ? (
            <p className="suggestion-success">Shared successfully! They&apos;ll see it in their dashboard.</p>
          ) : (
            <form onSubmit={handleShare} className="share-form">
              <p className="share-desc">Share this item with a family member or colleague. They need a Nava account.</p>
              <div className="form-group">
                <label>Their email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="partner@example.com"
                  required
                />
              </div>
              {error && <p className="suggestion-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
