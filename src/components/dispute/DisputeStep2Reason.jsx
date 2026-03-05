import { APP_CONFIG } from '../../lib/config';

export default function DisputeStep2Reason({ disputeReason, setDisputeReason, additionalDetails, setAdditionalDetails }) {
  return (
    <div className="dispute-step">
      <h3>Step 2: Why are you disputing?</h3>
      <div className="reason-grid">
        {(APP_CONFIG.disputeReasons || []).map((reason) => (
          <button
            key={reason.id}
            type="button"
            className={`reason-option ${disputeReason === reason.id ? 'selected' : ''}`}
            onClick={() => setDisputeReason(reason.id)}
          >
            <strong>{reason.label}</strong>
            <small>{reason.description}</small>
          </button>
        ))}
      </div>
      <div className="form-group">
        <label>Additional Details (optional but recommended)</label>
        <textarea
          value={additionalDetails}
          onChange={(e) => setAdditionalDetails(e.target.value)}
          placeholder="Describe what happened in detail. Include any evidence you have (photos, receipts, etc.)"
          rows={4}
        />
      </div>
    </div>
  );
}
