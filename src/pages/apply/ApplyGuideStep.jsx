import { Link } from 'react-router-dom';
import { ExternalLink, FileText, Sparkles, Lock, Copy, Check } from 'lucide-react';

export default function ApplyGuideStep({
  appType,
  formData,
  copiedField,
  onCopyField,
  fields,
}) {
  return (
    <div className="step-guide">
      <div className="step-header">
        <h2>Application Guide</h2>
        <span className="step-badge">Step 3 of 3: Apply on IRCC</span>
      </div>

      <div className="guide-checklist">
        <h4>Before you start — have these ready</h4>
        <ul>
          <li>Valid passport</li>
          <li>Digital photo (IRCC specs)</li>
          {appType?.id === 'work_permit' && <li>Job offer letter or LMIA</li>}
          {appType?.id === 'study_permit' && <li>Letter of acceptance from DLI</li>}
          {appType?.id === 'pr_card' && <li>Proof of residency in Canada</li>}
          <li>Credit card for fee ({appType?.fee})</li>
        </ul>
      </div>

      <div className="guide-cta">
        <a
          href={appType?.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary btn-lg"
        >
          <ExternalLink size={20} />
          Open IRCC Portal — Apply Now
        </a>
      </div>

      <div className="apply-options">
        <div className="apply-option active">
          <div className="option-header">
            <FileText size={20} />
            <h3>Guided Application</h3>
            <span className="available-badge">Available</span>
          </div>
          <p>We&apos;ll guide you step-by-step. You fill in the forms yourself.</p>
        </div>
        <div className="apply-option coming-soon">
          <div className="option-header">
            <Sparkles size={20} />
            <h3>Fully Automated</h3>
            <span className="coming-soon-badge"><Lock size={12} /> Coming Soon</span>
          </div>
          <p>We submit everything for you. Requires licensed immigration consultant.</p>
        </div>
      </div>

      <div className="guide-intro">
        <p>Follow these steps to complete your {appType?.name} application on the official IRCC website.</p>
      </div>

      <div className="guide-steps">
        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Sign in to your IRCC account</h4>
            <p>Use GCKey or Sign-In Partner to access your account.</p>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Start a new application</h4>
            <p>Click &quot;Apply to come to Canada&quot; → Select &quot;{appType?.name}&quot;</p>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Fill in your details</h4>
            <p>Copy your information from below:</p>
            <div className="copy-fields">
              {fields.map((field) => formData[field.id] && (
                <div key={field.id} className="copy-field">
                  <span className="field-label">{field.label}</span>
                  <div className="field-value-row">
                    <span className="field-value">{formData[field.id]}</span>
                    <button
                      type="button"
                      className={`copy-btn ${copiedField === field.id ? 'copied' : ''}`}
                      onClick={() => onCopyField(formData[field.id], field.id)}
                    >
                      {copiedField === field.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Upload required documents</h4>
            <p>You&apos;ll need: passport, photos, and supporting documents.</p>
            <Link to="/documents" className="btn btn-ghost btn-sm">View Your Documents</Link>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h4>Pay the fee ({appType?.fee})</h4>
            <p>Pay online with credit card or debit.</p>
          </div>
        </div>
        <div className="guide-step">
          <div className="step-number">6</div>
          <div className="step-content">
            <h4>Submit and track</h4>
            <p>After submitting, add the deadline to your tracker.</p>
            <Link to="/dashboard" className="btn btn-primary btn-sm">Add to Tracker</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
