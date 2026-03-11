import { Check, Edit3 } from 'lucide-react';
import { EMPTY_EMOJIS } from '../dashboard/constants';

export default function AddItemScanConfirm({
  categoryId,
  categoryName,
  name,
  dueDate,
  notes,
  onTrackIt,
  onEditDetails,
  tracking,
}) {
  const emoji = EMPTY_EMOJIS[categoryId] || '📌';

  return (
    <div className="scan-confirm-screen">
      <div className="scan-confirm-card">
        <div className="scan-confirm-header">
          <span className="scan-confirm-emoji" aria-hidden>{emoji}</span>
          <div className="scan-confirm-title-row">
            <h3 className="scan-confirm-name">{name || 'Document'}</h3>
            {categoryName && (
              <span className="scan-confirm-category">{categoryName}</span>
            )}
          </div>
        </div>
        {dueDate && (
          <p className="scan-confirm-detail">
            <strong>Expires:</strong>{' '}
            {new Date(dueDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        {notes && (
          <p className="scan-confirm-notes">{notes}</p>
        )}
      </div>
      <p className="scan-confirm-hint">We identified this from your photo. Confirm to start tracking.</p>
      <div className="scan-confirm-actions">
        <button
          type="button"
          className="btn btn-primary scan-confirm-track"
          onClick={onTrackIt}
          disabled={tracking}
        >
          {tracking ? (
            <>
              <span className="loading-spinner small" /> Tracking…
            </>
          ) : (
            <>
              <Check size={18} /> Track it
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onEditDetails}
          disabled={tracking}
        >
          <Edit3 size={18} /> Edit details
        </button>
      </div>
    </div>
  );
}
