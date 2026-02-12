import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Copy, 
  ExternalLink, 
  FileText, 
  Plane, 
  Briefcase, 
  GraduationCap,
  Heart,
  Clock,
  Sparkles,
  Lock
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';
import AddressAutocomplete from '../components/AddressAutocomplete';
import ScanUpload from '../components/ScanUpload';
import { EXTRACT_PROMPTS } from '../lib/scanPrompts';

// Application types
const APPLICATION_TYPES = {
  work_permit: {
    id: 'work_permit',
    name: 'Work Permit',
    icon: <Briefcase size={24} />,
    description: 'Apply for or extend a work permit in Canada',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit.html',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html',
    processingTime: '2-16 weeks',
    fee: '$155',
  },
  study_permit: {
    id: 'study_permit',
    name: 'Study Permit',
    icon: <GraduationCap size={24} />,
    description: 'Apply for or extend a study permit in Canada',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit.html',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html',
    processingTime: '4-16 weeks',
    fee: '$150',
  },
  visitor_visa: {
    id: 'visitor_visa',
    name: 'Visitor Visa',
    icon: <Plane size={24} />,
    description: 'Apply for a visitor visa (TRV) to Canada',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html',
    processingTime: '2-8 weeks',
    fee: '$100',
  },
  pr_card: {
    id: 'pr_card',
    name: 'PR Card Renewal',
    icon: <Heart size={24} />,
    description: 'Renew your Permanent Resident card',
    url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/new-immigrants/pr-card.html',
    applyUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/account.html',
    processingTime: '6-12 weeks',
    fee: '$50',
  },
};

// Form fields for each application type (used for both guide AND future automation)
const APPLICATION_FIELDS = {
  work_permit: [
    { id: 'given_name', label: 'Given Name(s)', type: 'text', required: true },
    { id: 'family_name', label: 'Family Name', type: 'text', required: true },
    { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
    { id: 'country_birth', label: 'Country of Birth', type: 'text', required: true },
    { id: 'country_citizenship', label: 'Country of Citizenship', type: 'text', required: true },
    { id: 'passport_number', label: 'Passport Number', type: 'text', required: true },
    { id: 'passport_expiry', label: 'Passport Expiry Date', type: 'date', required: true },
    { id: 'email', label: 'Email Address', type: 'email', required: true },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
    { id: 'address_canada', label: 'Address in Canada', type: 'address', required: false },
    { id: 'employer_name', label: 'Employer Name', type: 'text', required: true },
    { id: 'employer_address', label: 'Employer Address', type: 'address', required: true },
    { id: 'job_title', label: 'Job Title', type: 'text', required: true },
    { id: 'lmia_number', label: 'LMIA Number (if applicable)', type: 'text', required: false },
    { id: 'start_date', label: 'Intended Start Date', type: 'date', required: true },
    { id: 'end_date', label: 'Intended End Date', type: 'date', required: true },
  ],
  study_permit: [
    { id: 'given_name', label: 'Given Name(s)', type: 'text', required: true },
    { id: 'family_name', label: 'Family Name', type: 'text', required: true },
    { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
    { id: 'country_birth', label: 'Country of Birth', type: 'text', required: true },
    { id: 'country_citizenship', label: 'Country of Citizenship', type: 'text', required: true },
    { id: 'passport_number', label: 'Passport Number', type: 'text', required: true },
    { id: 'passport_expiry', label: 'Passport Expiry Date', type: 'date', required: true },
    { id: 'email', label: 'Email Address', type: 'email', required: true },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
    { id: 'school_name', label: 'School/Institution Name', type: 'text', required: true },
    { id: 'dli_number', label: 'DLI Number', type: 'text', required: true },
    { id: 'program_name', label: 'Program Name', type: 'text', required: true },
    { id: 'program_start', label: 'Program Start Date', type: 'date', required: true },
    { id: 'program_end', label: 'Program End Date', type: 'date', required: true },
  ],
  visitor_visa: [
    { id: 'given_name', label: 'Given Name(s)', type: 'text', required: true },
    { id: 'family_name', label: 'Family Name', type: 'text', required: true },
    { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
    { id: 'country_citizenship', label: 'Country of Citizenship', type: 'text', required: true },
    { id: 'passport_number', label: 'Passport Number', type: 'text', required: true },
    { id: 'passport_expiry', label: 'Passport Expiry Date', type: 'date', required: true },
    { id: 'email', label: 'Email Address', type: 'email', required: true },
    { id: 'purpose', label: 'Purpose of Visit', type: 'text', required: true },
    { id: 'travel_dates', label: 'Planned Travel Dates', type: 'text', required: true },
  ],
  pr_card: [
    { id: 'given_name', label: 'Given Name(s)', type: 'text', required: true },
    { id: 'family_name', label: 'Family Name', type: 'text', required: true },
    { id: 'dob', label: 'Date of Birth', type: 'date', required: true },
    { id: 'pr_number', label: 'PR Number (A#)', type: 'text', required: true },
    { id: 'current_address', label: 'Current Address in Canada', type: 'address', required: true },
    { id: 'email', label: 'Email Address', type: 'email', required: true },
    { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
  ],
};

export default function Apply() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  
  const [selectedType, setSelectedType] = useState(typeParam || null);
  const [currentStep, setCurrentStep] = useState(0); // 0: select, 1: fill, 2: review, 3: guide
  const [formData, setFormData] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedApplication, setSavedApplication] = useState(null);

  const appType = selectedType ? APPLICATION_TYPES[selectedType] : null;
  const fields = selectedType ? APPLICATION_FIELDS[selectedType] : [];

  const loadSavedApplication = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', selectedType)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setSavedApplication(data);
        setFormData(data.form_data || {});
      }
    } catch {
      // No saved application, that's fine
    }
  };

  useEffect(() => {
    if (user && selectedType) {
      queueMicrotask(() => loadSavedApplication());
    }
  }, [user, selectedType]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveApplication = async () => {
    setSaving(true);
    try {
      const appData = {
        user_id: user.id,
        type: selectedType,
        form_data: formData,
        status: 'draft',
        updated_at: new Date().toISOString(),
      };

      if (savedApplication) {
        await supabase
          .from('applications')
          .update(appData)
          .eq('id', savedApplication.id);
      } else {
        const { data } = await supabase
          .from('applications')
          .insert([{ ...appData, created_at: new Date().toISOString() }])
          .select()
          .single();
        setSavedApplication(data);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
    setSaving(false);
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const copyToClipboard = (value, fieldId) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    setCurrentStep(1);
  };

  const handleContinueToReview = async () => {
    await saveApplication();
    setCurrentStep(2);
  };

  const handleStartGuide = () => {
    setCurrentStep(3);
  };

  const isFormComplete = () => {
    return fields.filter(f => f.required).every(f => formData[f.id]?.trim());
  };

  return (
    <div className="apply-page">
      <header className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="header-title">
          <FileText size={24} />
          <span>Apply for Permits</span>
        </div>
        <div style={{ width: 80 }} />
      </header>

      <main className="apply-main">
        <div className="apply-container">
          

          {/* Step 0: Select Application Type */}
          {currentStep === 0 && (
            <div className="step-select">
              <h2>What would you like to apply for?</h2>
              <div className="type-grid">
                {Object.values(APPLICATION_TYPES).map(type => (
                  <button
                    key={type.id}
                    className="type-card"
                    onClick={() => handleSelectType(type.id)}
                  >
                    <div className="type-icon">{type.icon}</div>
                    <div className="type-info">
                      <h3>{type.name}</h3>
                      <p>{type.description}</p>
                      <div className="type-meta">
                        <span><Clock size={14} /> {type.processingTime}</span>
                        <span>Fee: {type.fee}</span>
                      </div>
                    </div>
                    <ArrowRight size={20} className="type-arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Fill Form */}
          {currentStep === 1 && appType && (
            <div className="step-fill">
              <div className="step-header">
                <button className="btn btn-ghost btn-sm" onClick={() => { setCurrentStep(0); setSelectedType(null); }}>
                  <ArrowLeft size={16} /> Change Type
                </button>
                <h2>{appType.name} Application</h2>
                <span className="step-badge">Step 1 of 3: Fill Details</span>
              </div>

              <p className="step-desc">
                Enter your information below. We'll save it and guide you through the official application.
              </p>

              {/* Scan passport/documents to auto-fill */}
              <div className="scan-docs-section">
                <label>📄 Scan your passport or documents to auto-fill</label>
                <ScanUpload 
                  onExtracted={(data) => {
                    // Auto-fill form fields from extracted data
                    if (data.fullName) handleFieldChange('full_name', data.fullName);
                    if (data.dateOfBirth) handleFieldChange('date_of_birth', data.dateOfBirth);
                    if (data.passportNumber) handleFieldChange('passport_number', data.passportNumber);
                    if (data.nationality) handleFieldChange('nationality', data.nationality);
                    if (data.expiryDate) handleFieldChange('passport_expiry', data.expiryDate);
                  }}
                  extractPrompt={EXTRACT_PROMPTS.passport}
                />
              </div>

              <div className="or-divider"><span>or enter manually</span></div>

              <form className="application-form">
                {fields.map(field => (
                  <div key={field.id} className="form-group">
                    {field.type === 'address' ? (
                      <AddressAutocomplete
                        label={field.label}
                        value={typeof formData[field.id] === 'object' ? formData[field.id]?.full : formData[field.id]}
                        onChange={(addr) => handleFieldChange(field.id, addr?.full || '')}
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
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            rows={3}
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.type === 'date' ? '' : `Enter ${field.label.toLowerCase()}`}
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-ghost"
                    onClick={saveApplication}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleContinueToReview}
                    disabled={!isFormComplete()}
                  >
                    Continue to Review
                    <ArrowRight size={18} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Review */}
          {currentStep === 2 && appType && (
            <div className="step-review">
              <div className="step-header">
                <button className="btn btn-ghost btn-sm" onClick={() => setCurrentStep(1)}>
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
                {fields.map(field => (
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
                <button className="btn btn-ghost" onClick={() => setCurrentStep(1)}>
                  Edit Information
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleStartGuide}
                >
                  Start Application Guide
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Guided Application */}
          {currentStep === 3 && appType && (
            <div className="step-guide">
              <div className="step-header">
                <h2>Application Guide</h2>
                <span className="step-badge">Step 3 of 3: Apply on IRCC</span>
              </div>

              {/* Before you start checklist */}
              <div className="guide-checklist">
                <h4>Before you start — have these ready</h4>
                <ul>
                  <li>Valid passport</li>
                  <li>Digital photo (IRCC specs)</li>
                  {appType.id === 'work_permit' && <li>Job offer letter or LMIA</li>}
                  {appType.id === 'study_permit' && <li>Letter of acceptance from DLI</li>}
                  {appType.id === 'pr_card' && <li>Proof of residency in Canada</li>}
                  <li>Credit card for fee ({appType.fee})</li>
                </ul>
              </div>

              {/* Primary CTA: Open IRCC */}
              <div className="guide-cta">
                <a 
                  href={appType.applyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg"
                >
                  <ExternalLink size={20} />
                  Open IRCC Portal — Apply Now
                </a>
              </div>

              {/* Two Options: Guided vs Automated */}
              <div className="apply-options">
                <div className="apply-option active">
                  <div className="option-header">
                    <FileText size={20} />
                    <h3>Guided Application</h3>
                    <span className="available-badge">Available</span>
                  </div>
                  <p>We'll guide you step-by-step. You fill in the forms yourself.</p>
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
                <p>Follow these steps to complete your {appType.name} application on the official IRCC website.</p>
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
                    <p>Click "Apply to come to Canada" → Select "{appType.name}"</p>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Fill in your details</h4>
                    <p>Copy your information from below:</p>
                    
                    <div className="copy-fields">
                      {fields.map(field => formData[field.id] && (
                        <div key={field.id} className="copy-field">
                          <span className="field-label">{field.label}</span>
                          <div className="field-value-row">
                            <span className="field-value">{formData[field.id]}</span>
                            <button
                              className={`copy-btn ${copiedField === field.id ? 'copied' : ''}`}
                              onClick={() => copyToClipboard(formData[field.id], field.id)}
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
                    <p>You'll need: passport, photos, and supporting documents.</p>
                    <Link to="/documents" className="btn btn-ghost btn-sm">
                      View Your Documents
                    </Link>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h4>Pay the fee ({appType.fee})</h4>
                    <p>Pay online with credit card or debit.</p>
                  </div>
                </div>

                <div className="guide-step">
                  <div className="step-number">6</div>
                  <div className="step-content">
                    <h4>Submit and track</h4>
                    <p>After submitting, add the deadline to your tracker.</p>
                    <Link to="/dashboard" className="btn btn-primary btn-sm">
                      Add to Tracker
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

