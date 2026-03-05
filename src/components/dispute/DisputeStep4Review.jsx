import { Mail, ExternalLink } from 'lucide-react';

export default function DisputeStep4Review({
  selectedCity,
  ticketNumber,
  selectedReason,
  generateDisputeLetter,
}) {
  return (
    <div className="dispute-step">
      <h3>Step 4: Review & Send</h3>
      <div className="dispute-summary">
        <div className="summary-item"><span>City:</span><strong>{selectedCity?.name}</strong></div>
        <div className="summary-item"><span>Ticket #:</span><strong>{ticketNumber}</strong></div>
        <div className="summary-item"><span>Reason:</span><strong>{selectedReason?.label}</strong></div>
        <div className="summary-item"><span>Sending to:</span><strong>{selectedCity?.disputeEmail}</strong></div>
      </div>
      <div className="dispute-preview">
        <h4>Your Dispute Letter:</h4>
        <pre>{generateDisputeLetter()}</pre>
      </div>
      <div className="dispute-note">
        <Mail size={16} />
        <span>Clicking &quot;Open Email & Send&quot; will open your email app with everything pre-filled. Just review and hit Send!</span>
      </div>
      {selectedCity?.disputeInfo && (
        <a href={selectedCity.disputeInfo} target="_blank" rel="noopener noreferrer" className="dispute-info-link">
          <ExternalLink size={14} />
          View {selectedCity.name}&apos;s official dispute info
        </a>
      )}
    </div>
  );
}
