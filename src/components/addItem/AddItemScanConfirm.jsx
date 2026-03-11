import { useEffect, useRef } from 'react';
import { Check, Edit3 } from 'lucide-react';
import { EMPTY_EMOJIS } from '../dashboard/constants';
import { getVoicePreference, speak, stopSpeaking } from '../../lib/voice';

export default function AddItemScanConfirm({
  userId,
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
  const didSpeak = useRef(false);

  useEffect(() => {
    if (!userId || didSpeak.current) return;
    if (!getVoicePreference(userId)) return;
    didSpeak.current = true;
    const dateStr = dueDate
      ? new Date(dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const msg = [
      `We found ${name || 'your document'}.`,
      dateStr ? `Expires ${dateStr}.` : '',
      'You can tap Track it to start tracking, or Edit details to change anything.',
    ].filter(Boolean).join(' ');
    speak(msg);
    return () => stopSpeaking();
  }, [userId, name, dueDate]);

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
          aria-label="Track this item and add it to your dashboard"
        >
          {tracking ? (
            <>
              <span className="loading-spinner small" aria-hidden /> Tracking…
            </>
          ) : (
            <>
              <Check size={18} aria-hidden /> Track it
            </>
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onEditDetails}
          disabled={tracking}
          aria-label="Edit details before tracking"
        >
          <Edit3 size={18} aria-hidden /> Edit details
        </button>
      </div>
    </div>
  );
}
