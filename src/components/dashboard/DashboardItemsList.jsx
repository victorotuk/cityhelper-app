import { addDays } from 'date-fns';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import ItemCard from './ItemCard';
import EmptyState from './EmptyState';
import { addToGoogleCalendar } from '../../lib/calendar';
import { parseTicketFromNotes } from '../../lib/payTicketUtils';

export default function DashboardItemsList({
  items, loading, groupedItems, getStatusInfo,
  onDelete, onRenew, onSnooze, onCopy, onFetchItems,
  setPayInitialValues, setShowPayModal,
  activeCountry, userId,
  bulkEditMode, bulkSelectedIds, toggleBulkSelect,
  setAuditItem, onAskAI,
  requireCountryForTracking, setShowAddModal, setSelectedCategory, persona,
}) {
  const makePayHandler = (item) =>
    item?.category === 'parking'
      ? () => { setPayInitialValues(parseTicketFromNotes(item.notes)); setShowPayModal(true); }
      : null;

  const renderItemCard = (item) => (
    <ItemCard
      key={item.id}
      item={item}
      getStatusInfo={getStatusInfo}
      onDelete={onDelete}
      onAddToCalendar={addToGoogleCalendar}
      onCopy={onCopy}
      onPay={makePayHandler}
      onRenew={(url) => url && window.open(url, '_blank')}
      userCountry={activeCountry}
      onMarkDone={() => onRenew(item.id)}
      onSnooze={(days) => onSnooze(item.id, addDays(new Date(), days).toISOString())}
      onShared={() => onFetchItems(userId)}
      bulkEditMode={bulkEditMode}
      bulkSelected={bulkSelectedIds.has(item.id)}
      onBulkToggle={() => toggleBulkSelect(item.id, !item.isShared)}
      onShowHistory={setAuditItem}
      onAskAI={onAskAI}
    />
  );

  return (
    <div className="items-list">
      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState
          requireCountryForTracking={requireCountryForTracking}
          setShowAddModal={setShowAddModal}
          setSelectedCategory={setSelectedCategory}
          persona={persona}
        />
      ) : (
        <>
          {(groupedItems.overdue.length > 0 || groupedItems.urgent.length > 0) && (
            <div className="items-section urgent">
              <h3><AlertTriangle size={18} /> Needs Attention</h3>
              {[...groupedItems.overdue, ...groupedItems.urgent].map(renderItemCard)}
            </div>
          )}

          {groupedItems.warning.length > 0 && (
            <div className="items-section warning">
              <h3><Clock size={18} /> Coming Up (30 days)</h3>
              {groupedItems.warning.map(renderItemCard)}
            </div>
          )}

          {groupedItems.ok.length > 0 && (
            <div className="items-section ok">
              <h3><CheckCircle size={18} /> All Good</h3>
              {groupedItems.ok.map(renderItemCard)}
            </div>
          )}

          {groupedItems.completed.length > 0 && (
            <div className="items-section completed">
              <h3><CheckCircle size={18} /> Recently Completed</h3>
              <p className="section-desc" style={{ marginBottom: 'var(--space-sm)' }}>Items you marked done in the last 30 days</p>
              {groupedItems.completed.map(renderItemCard)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
