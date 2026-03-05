import { useState, useEffect } from 'react';
import { X, History } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function AuditModal({ item, onClose }) {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item?.id) return;
    const fetchAudit = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('compliance_item_audit')
        .select('action, old_data, new_data, created_at')
        .eq('item_id', item.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setAuditLog(data || []);
      setLoading(false);
    };
    fetchAudit();
  }, [item?.id]);

  const actionLabels = {
    created: 'Created',
    updated: 'Updated',
    renewed: 'Marked done',
    snoozed: 'Snoozed',
    deleted: 'Deleted',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal audit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><History size={20} /> History: {item?.name}</h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : auditLog.length === 0 ? (
            <p className="section-desc">No history yet.</p>
          ) : (
            <ul className="audit-list">
              {auditLog.map((entry, i) => (
                <li key={i} className="audit-entry">
                  <span className="audit-action">{actionLabels[entry.action] || entry.action}</span>
                  <span className="audit-date">{format(new Date(entry.created_at), 'MMM d, yyyy · h:mm a')}</span>
                  {(entry.old_data || entry.new_data) && (
                    <div className="audit-diff">
                      {entry.new_data?.due_date && entry.old_data?.due_date !== entry.new_data?.due_date && (
                        <span>Due: {entry.old_data?.due_date || '—'} → {entry.new_data.due_date}</span>
                      )}
                      {entry.new_data?.last_completed_at && (
                        <span>Completed</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
