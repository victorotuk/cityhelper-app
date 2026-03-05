import { useState } from 'react';
import { MessageSquarePlus, Send, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export default function SuggestionBox({ onClose, onSuccess }) {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !user) return;

    setSending(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('user_suggestions')
        .insert({ user_id: user.id, suggestion: trimmed });

      if (err) throw err;
      setSent(true);
      setText('');
      onSuccess?.();
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setError(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal suggestion-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><MessageSquarePlus size={20} /> Suggest something to track</h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="suggestion-desc">
            What would you like us to add? New categories, templates, or reminders — we read every suggestion.
          </p>
          {sent ? (
            <p className="suggestion-success">Thanks! We&apos;ll consider your suggestion.</p>
          ) : (
            <form onSubmit={handleSubmit} className="suggestion-form">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. Add 'Seasonal allergies' to Health, or 'Conference booth' to Events..."
                rows={4}
                maxLength={500}
                disabled={sending}
              />
              <span className="char-count">{text.length}/500</span>
              {error && <p className="suggestion-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!text.trim() || sending}>
                  {sending ? 'Sending...' : <><Send size={16} /> Send</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
