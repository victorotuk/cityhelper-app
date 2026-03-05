import { Target } from 'lucide-react';
import { addDays } from 'date-fns';
import ItemCard from './ItemCard';

/**
 * Dashboard "Focus on these 3" priority block (Mial-style).
 */
export default function FocusOnThree({
  groupedItems,
  getStatusInfo,
  onDelete,
  onRenew,
  onSnooze,
  onAddToCalendar,
  onCopy,
  onPay,
  userCountry,
  onShared,
  bulkEditMode,
  bulkSelectedIds,
  toggleBulkSelect,
  onShowHistory,
  onAskAI
}) {
  const top3 = [
    ...groupedItems.overdue,
    ...groupedItems.urgent,
    ...groupedItems.warning
  ].slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div className="focus-on-three">
      <h3><Target size={18} /> Focus on these 3</h3>
      <p className="focus-sub">Your most urgent items — knock these out first.</p>
      <div className="focus-cards">
        {top3.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            getStatusInfo={getStatusInfo}
            onDelete={onDelete}
            onAddToCalendar={onAddToCalendar}
            onCopy={onCopy}
            onPay={onPay}
            onRenew={(url) => url && window.open(url, '_blank')}
            userCountry={userCountry}
            onMarkDone={() => onRenew(item.id)}
            onSnooze={(days) => onSnooze(item.id, addDays(new Date(), days).toISOString())}
            onShared={onShared}
            bulkEditMode={bulkEditMode}
            bulkSelected={bulkSelectedIds?.has(item.id)}
            onBulkToggle={() => toggleBulkSelect?.(item.id, !item.isShared)}
            onShowHistory={onShowHistory}
            onAskAI={onAskAI}
          />
        ))}
      </div>
    </div>
  );
}
