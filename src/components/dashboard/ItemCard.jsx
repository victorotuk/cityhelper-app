import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
  Check, Clock, CreditCard, FileText, History, MessageSquarePlus, Phone,
  RefreshCw, Share2, Trash2, CalendarPlus, Copy
} from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';
import { getRenewalUrl } from '../../lib/renewalPortals';
import { EMPTY_EMOJIS } from './constants';
import ShareItemModal from '../modals/ShareItemModal';

const SWIPE_THRESHOLD = 80;

function useSwipe({ onSwipeLeft, onSwipeRight }) {
  const startX = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const elRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    swiping.current = true;
    if (elRef.current) elRef.current.style.transition = 'none';
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!swiping.current) return;
    const dx = e.touches[0].clientX - startX.current;
    currentX.current = dx;
    if (elRef.current) {
      const clamped = Math.max(-140, Math.min(140, dx));
      elRef.current.style.transform = `translateX(${clamped}px)`;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    swiping.current = false;
    if (elRef.current) {
      elRef.current.style.transition = 'transform 0.25s ease';
      elRef.current.style.transform = 'translateX(0)';
    }
    if (currentX.current < -SWIPE_THRESHOLD && onSwipeLeft) onSwipeLeft();
    if (currentX.current > SWIPE_THRESHOLD && onSwipeRight) onSwipeRight();
  }, [onSwipeLeft, onSwipeRight]);

  return { elRef, onTouchStart, onTouchMove, onTouchEnd };
}

function getCategoryEmoji(id) {
  return EMPTY_EMOJIS[id] || '📌';
}

export default function ItemCard({
  item,
  getStatusInfo,
  onDelete,
  onAddToCalendar,
  onCopy,
  onPay,
  onRenew,
  userCountry,
  onMarkDone,
  onSnooze,
  onShared,
  bulkEditMode,
  bulkSelected,
  onBulkToggle,
  onShowHistory,
  onAskAI
}) {
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const statusInfo = getStatusInfo(item.due_date);
  const category = APP_CONFIG.categories.find(c => c.id === item.category);
  const payHandler = onPay?.(item);
  const renewalUrl = onRenew && userCountry ? getRenewalUrl(item.name, userCountry) : null;

  const { elRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipe({
    onSwipeLeft: onMarkDone,
    onSwipeRight: () => onSnooze?.(1),
  });

  return (
    <div className={`item-card-wrap ${statusInfo.status}`}>
      <div className="swipe-action swipe-done"><Check size={20} /> Done</div>
      <div className="swipe-action swipe-snooze"><Clock size={20} /> Snooze</div>
      <div
        ref={elRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`item-card ${statusInfo.status} ${bulkEditMode && !item.isShared ? 'bulk-selectable' : ''}`}
      >
      {bulkEditMode && !item.isShared && (
        <button
          type="button"
          className={`bulk-checkbox ${bulkSelected ? 'selected' : ''}`}
          onClick={() => onBulkToggle?.()}
          aria-label={bulkSelected ? 'Deselect' : 'Select'}
        >
          {bulkSelected && <Check size={14} />}
        </button>
      )}
      <div className="item-icon" style={{ background: category?.color || '#64748b' }}>
        {getCategoryEmoji(item.category)}
      </div>
      <div className="item-content">
        <h4>{item.name}</h4>
        <span className="item-category">{category?.name || 'Other'}</span>
        {item.due_date && (
          <span className="item-date">Due: {format(parseISO(item.due_date), 'MMM d, yyyy')}</span>
        )}
        {item.last_completed_at && (
          <span className="item-completed">Last done: {format(parseISO(item.last_completed_at), 'MMM d, yyyy')}</span>
        )}
        {item.document_id && (
          <Link to="/documents" className="item-doc-link"><FileText size={12} /> Document linked</Link>
        )}
      </div>
      <div className="item-status">
        <span className={`status-badge ${statusInfo.status}`}>{statusInfo.label}</span>
        <div className="item-actions">
          {payHandler && (
            <button type="button" className="btn-icon" onClick={payHandler} title="Pay ticket">
              <CreditCard size={16} />
            </button>
          )}
          {renewalUrl && (
            <button type="button" className="btn-icon" onClick={() => onRenew(renewalUrl)} title="Renew now">
              <RefreshCw size={16} />
            </button>
          )}
          {item.pay_url && (
            <button type="button" className="btn-icon" onClick={() => window.open(item.pay_url, '_blank')} title={`Pay online: ${item.pay_url}`}>
              <CreditCard size={16} />
            </button>
          )}
          {item.pay_phone && (
            <a className="btn-icon" href={`tel:${item.pay_phone.replace(/[^\d+]/g, '')}`} title={`Call to pay: ${item.pay_phone}`}>
              <Phone size={16} />
            </a>
          )}
          {onMarkDone && (
            <button type="button" className="btn-icon" onClick={onMarkDone} title="Mark done & set next">
              <Check size={16} />
            </button>
          )}
          {onSnooze && (
            <div className="snooze-wrap">
              <button type="button" className="btn-icon" onClick={() => setSnoozeOpen(!snoozeOpen)} title="Snooze reminders">
                <Clock size={16} />
              </button>
              {snoozeOpen && (
                <>
                  <div className="snooze-backdrop" aria-hidden="true" onClick={() => setSnoozeOpen(false)} />
                  <div className="snooze-menu">
                    <button type="button" onClick={() => { onSnooze(1); setSnoozeOpen(false); }}>1 day</button>
                    <button type="button" onClick={() => { onSnooze(3); setSnoozeOpen(false); }}>3 days</button>
                    <button type="button" onClick={() => { onSnooze(7); setSnoozeOpen(false); }}>1 week</button>
                  </div>
                </>
              )}
            </div>
          )}
          {!item.isShared && onShared && (
            <button type="button" className="btn-icon" onClick={() => setShowShareModal(true)} title="Share with family">
              <Share2 size={16} />
            </button>
          )}
          {onShowHistory && (
            <button type="button" className="btn-icon" onClick={() => onShowHistory(item)} title="View history">
              <History size={16} />
            </button>
          )}
          {onAskAI && (
            <button type="button" className="btn-icon ask-ai-icon" onClick={() => onAskAI(item)} title="Ask AI about this">
              <MessageSquarePlus size={16} />
            </button>
          )}
          <button
            type="button"
            className="btn-icon"
            onClick={() => onCopy(item)}
            title="Copy to share"
          >
            <Copy size={16} />
          </button>
          {item.due_date && (
            <button
              type="button"
              className="btn-icon"
              onClick={() => onAddToCalendar(item)}
              title="Add to Google Calendar"
            >
              <CalendarPlus size={16} />
            </button>
          )}
          <button type="button" className="btn-icon" onClick={() => onDelete(item.id)} title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {showShareModal && (
        <ShareItemModal
          item={item}
          onClose={() => setShowShareModal(false)}
          onShared={() => { onShared?.(); setShowShareModal(false); }}
        />
      )}
      </div>
    </div>
  );
}
