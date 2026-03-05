import { ArrowLeft, ArrowRight } from 'lucide-react';
import { APPLICATION_FIELDS } from './applyConfig';

export default function ApplyReviewStep({
  appType,
  formData,
  onEdit,
  onStartGuide,
}) {
  const fields = appType ? APPLICATION_FIELDS[appType.id] || [] : [];

  return (
    <div className="step-review">
      <div className="step-header">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(1)}>
          <ArrowLeft size={16} /> Edit Details
        </button>
        <h2>Review Your Information</h2>
        <span className="step-badge">Step 2 of 3: Review & Confirm</span>
      </div>

      <div className="review-notice">
        <span>⚠️</span>
        <p><strong>Important:</strong> Review all information carefully. You are responsible for the accuracy of your application.</p>
      </div>

      <div className="review-grid">
        {fields.map((field) => (
          <div key={field.id} className="review-item">
            <span className="review-label">{field.label}</span>
            <span className="review-value">{formData[field.id] || '—'}</span>
          </div>
        ))}
      </div>

      <div className="consent-box">
        <label>
          <input type="checkbox" id="consent" />
          <span>I confirm that all information provided is accurate and complete. I understand that providing false information may result in application refusal.</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => onEdit(1)}>
          Edit Information
        </button>
        <button type="button" className="btn btn-primary" onClick={onStartGuide}>
          Start Application Guide
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
