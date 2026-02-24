import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { format } from 'date-fns';
import { APP_CONFIG } from '../lib/config';

// Map calendar event keywords to compliance categories
const SUGGEST_CATEGORY = (title, description) => {
  const text = `${(title || '').toLowerCase()} ${(description || '').toLowerCase()}`;
  if (/\b(renewal|expir|license|permit|visa|passport)\b/.test(text)) return 'immigration';
  if (/\b(driver|vehicle|registration|plate)\b/.test(text)) return 'driving';
  if (/\b(parking|ticket|407|toll|violation)\b/.test(text)) return 'parking';
  if (/\b(tax|filing|return|CRA|IRS)\b/.test(text)) return 'tax';
  if (/\b(insurance|policy)\b/.test(text)) return 'personal_insurance';
  if (/\b(health|doctor|appointment|dental)\b/.test(text)) return 'health';
  if (/\b(school|exam|tuition|enrollment)\b/.test(text)) return 'education';
  if (/\b(birthday|anniversary|wedding)\b/.test(text)) return 'important_dates';
  if (/\b(mortgage|property|lease|rent)\b/.test(text)) return 'housing';
  return 'other';
};

export default function CalendarImportModal({ onClose, onAddItems, userId }) {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.getPlatform() !== 'web');
  }, []);

  const loadEvents = async () => {
    if (!isNative) return;
    setLoading(true);
    setError(null);
    try {
      const { CapacitorCalendar } = await import('@ebarooni/capacitor-calendar');
      const { result: perm } = await CapacitorCalendar.requestReadOnlyCalendarAccess();
      if (perm !== 'granted') {
        setError('Calendar access was denied.');
        setLoading(false);
        return;
      }
      const now = Date.now();
      const from = now - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      const to = now + 90 * 24 * 60 * 60 * 1000;  // 90 days ahead
      const { result } = await CapacitorCalendar.listEventsInRange({ from, to });
      // Filter out all-day birthdays and empty titles
      const filtered = (result || []).filter(e => e.title && e.title.trim());
      setEvents(filtered);
    } catch (err) {
      setError(err?.message || 'Could not load calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isNative) loadEvents();
  }, [isNative]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const toAdd = events.filter(e => selected.has(e.id)).map(e => {
      const category = SUGGEST_CATEGORY(e.title, e.description);
      const dueDate = e.startDate ? format(new Date(e.startDate), 'yyyy-MM-dd') : null;
      return {
        name: e.title?.trim() || 'Calendar event',
        category,
        due_date: dueDate,
        notes: e.description || e.location ? [e.description, e.location].filter(Boolean).join('\n') : null,
        user_id: userId,
        created_at: new Date().toISOString(),
      };
    });
    onAddItems(toAdd);
    onClose();
  };

  if (!isNative) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2><Calendar size={20} /> Import from Calendar</h2>
            <button className="btn-icon" onClick={onClose}><X size={20} /></button>
          </div>
          <div className="modal-body">
            <p className="section-desc">
              Calendar import is available in the Nava mobile app (Android). 
              Install the app to import events from your device calendar and turn them into tracked items.
            </p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose}>OK</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal calendar-import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Calendar size={20} /> Import from Calendar</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="section-desc">Select calendar events to add as compliance items. We&apos;ll suggest categories.</p>
          {error && <p className="suggestion-error">{error}</p>}
          {loading ? (
            <div className="loading">Loading calendar...</div>
          ) : events.length === 0 ? (
            <p className="section-desc">No upcoming events found in the next 90 days.</p>
          ) : (
            <div className="calendar-events-list">
              {events.map(e => {
                const cat = SUGGEST_CATEGORY(e.title, e.description);
                const catLabel = APP_CONFIG.categories.find(c => c.id === cat)?.name || 'Other';
                const dueStr = e.startDate ? format(new Date(e.startDate), 'MMM d, yyyy') : '';
                return (
                  <label key={e.id} className={`calendar-event-row ${selected.has(e.id) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selected.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                    />
                    <div className="calendar-event-info">
                      <strong>{e.title}</strong>
                      <span className="calendar-event-meta">{dueStr} · {catLabel}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={selected.size === 0}
            >
              Add {selected.size} item{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
