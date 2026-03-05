import { useState } from 'react';
import { X } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';

export default function BulkEditModal({ selectedIds: _selectedIds, itemCount, onClose, onApply, userCountries }) {
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');

  const handleApply = (e) => {
    e.preventDefault();
    const updates = {};
    if (dueDate) updates.due_date = dueDate;
    if (category) updates.category = category;
    if (country) updates.country = country;
    if (Object.keys(updates).length) {
      onApply(updates);
      onClose();
    }
  };

  const hasChanges = dueDate || category || country;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit {itemCount} item{itemCount !== 1 ? 's' : ''}</h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleApply} className="modal-body">
          <div className="form-group">
            <label>Change due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              placeholder="Leave empty to keep unchanged"
            />
          </div>
          <div className="form-group">
            <label>Change category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">Keep unchanged</option>
              {APP_CONFIG.categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {userCountries?.length >= 2 && (
            <div className="form-group">
              <label>Change country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}>
                <option value="">Keep unchanged</option>
                {userCountries.includes('ca') && <option value="ca">🇨🇦 Canada</option>}
                {userCountries.includes('us') && <option value="us">🇺🇸 United States</option>}
              </select>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!hasChanges}>
              Apply to {itemCount} item{itemCount !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
