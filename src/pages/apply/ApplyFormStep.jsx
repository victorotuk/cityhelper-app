import { ArrowLeft, ArrowRight } from 'lucide-react';
import AddressAutocomplete from '../../components/common/AddressAutocomplete';
import ScanUpload from '../../components/scanUpload/ScanUpload';
import { EXTRACT_PROMPTS } from '../../lib/scanPrompts';
import { APPLICATION_FIELDS } from './applyConfig';

export default function ApplyFormStep({
  appType,
  formData,
  saving,
  onFieldChange,
  onSaveDraft,
  onContinueToReview,
  onBack,
  isFormComplete,
}) {
  const fields = appType ? APPLICATION_FIELDS[appType.id] || [] : [];

  return (
    <div className="step-fill">
      <div className="step-header">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={16} /> Change Type
        </button>
        <h2>{appType?.name} Application</h2>
        <span className="step-badge">Step 1 of 3: Fill Details</span>
      </div>

      <p className="step-desc">
        Enter your information below. We&apos;ll save it and guide you through the official application.
      </p>

      <div className="scan-docs-section">
        <label>📄 Scan your passport or documents to auto-fill</label>
        <ScanUpload
          onExtracted={(data) => {
            if (data.fullName) onFieldChange('full_name', data.fullName);
            if (data.dateOfBirth) onFieldChange('date_of_birth', data.dateOfBirth);
            if (data.passportNumber) onFieldChange('passport_number', data.passportNumber);
            if (data.nationality) onFieldChange('nationality', data.nationality);
            if (data.expiryDate) onFieldChange('passport_expiry', data.expiryDate);
          }}
          extractPrompt={EXTRACT_PROMPTS.passport}
        />
      </div>

      <div className="or-divider"><span>or enter manually</span></div>

      <form className="application-form" onSubmit={(e) => e.preventDefault()}>
        {fields.map((field) => (
          <div key={field.id} className="form-group">
            {field.type === 'address' ? (
              <AddressAutocomplete
                label={field.label}
                value={typeof formData[field.id] === 'object' ? formData[field.id]?.full : formData[field.id]}
                onChange={(addr) => onFieldChange(field.id, addr?.full || '')}
                placeholder={`Start typing ${field.label.toLowerCase()}...`}
                required={field.required}
              />
            ) : (
              <>
                <label>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => onFieldChange(field.id, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.id] || ''}
                    onChange={(e) => onFieldChange(field.id, e.target.value)}
                    placeholder={field.type === 'date' ? '' : `Enter ${field.label.toLowerCase()}`}
                  />
                )}
              </>
            )}
          </div>
        ))}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onSaveDraft} disabled={saving}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onContinueToReview}
            disabled={!isFormComplete()}
          >
            Continue to Review
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
