import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, CheckCircle, FileText } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useComplianceStore } from '../stores/complianceStore';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';
import { TRUST_TYPES, hasTypeSelector, hasPeopleStep, getSetupGuide } from '../lib/setupWizardConfig';
import AppCard from '../components/ui/AppCard';
import PageHeader from '../components/ui/PageHeader';

const CATEGORY_EMOJIS = {
  immigration: '✈️', trust: '🏛️', tax: '💰', driving: '🚗', parking: '🅿️', health: '❤️', fitness: '💪',
  education: '📚', work_schedule: '⏰', retirement_estate: '📜', housing: '🏡',
  business_tax: '💰', employees: '👥', assets: '📦', liabilities: '⚠️',
  business_insurance: '🛡️', office: '💼', business_license: '📋', property: '🏠', professional: '🎓', other: '📌',
  subscriptions: '🔄', pet_care: '🐕', kids_family: '👶', personal_insurance: '🛡️',
  credit_banking: '💳', travel: '✈️', important_dates: '📅', legal_court: '⚖️', moving: '🚚', government_benefits: '📋',
  contracts: '📝', certifications: '🏅', patents_ip: '©️', environmental: '🌿', data_privacy: '🔒',
  employee_benefits: '🎁',
  inst_regulatory: '🏛️', inst_staff: '👨‍🏫', inst_student: '🎓', inst_finance: '💰',
  inst_safety: '🔥', inst_facilities: '🔧', inst_legal: '⚖️', inst_programs: '📖', inst_sports: '🏆',
};

function getCategoryEmoji(catId) {
  return CATEGORY_EMOJIS[catId] || '📌';
}

export default function ItemSetupWizard() {
  const { category: urlCategory } = useParams();
  const { user } = useAuthStore();
  const { addItem } = useComplianceStore();
  const navigate = useNavigate();

  const [category, setCategory] = useState(urlCategory || '');
  const [step, setStep] = useState(urlCategory ? 1 : 0);
  const [trustType, setTrustType] = useState('');
  const [name, setName] = useState('');
  const [trustee, setTrustee] = useState('');
  const [beneficiaries, setBeneficiaries] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [documentId, setDocumentId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const catMeta = APP_CONFIG.categories.find((c) => c.id === category);
  const templates = category ? (APP_CONFIG.templates[category] || []) : [];
  const useTypeSelector = hasTypeSelector(category);
  const usePeopleStep = hasPeopleStep(category);

  useEffect(() => {
    if (urlCategory && urlCategory !== category) {
      setCategory(urlCategory);
      setStep(1);
    }
  }, [urlCategory, category]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('documents')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setDocuments(data || []));
  }, [user?.id]);

  const notesValue = usePeopleStep
    ? [trustee && `Trustee: ${trustee}`, beneficiaries && `Beneficiaries: ${beneficiaries}`].filter(Boolean).join('\n\n')
    : notes;

  const handleCategorySelect = (catId) => {
    setCategory(catId);
    setStep(1);
    navigate(`/setup/${catId}`, { replace: true });
  };

  const handleFinish = async () => {
    if (!name.trim() || !user?.id || !category) return;
    setSaving(true);
    try {
      await addItem({
        name: name.trim(),
        category,
        due_date: dueDate || null,
        notes: notesValue || null,
        document_id: documentId || null,
        user_id: user.id,
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const canNextStep1 = useTypeSelector ? trustType && name.trim().length > 0 : name.trim().length > 0;
  const backTo = urlCategory ? (step === 1 ? '/dashboard' : undefined) : (step === 0 ? '/dashboard' : '/setup');

  if (done) {
    return (
      <div className="settings-page item-setup-page">
        <PageHeader backTo="/dashboard" title="Done" />
        <main className="settings-main">
          <div className="settings-container" style={{ maxWidth: 480 }}>
            <AppCard className="app-card--no-bar" noGradient>
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
                <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: 16 }} />
                <h2 style={{ marginBottom: 8 }}>Added to your dashboard</h2>
                <p className="section-desc" style={{ marginBottom: 24 }}>
                  We&apos;ll remind you about due dates and key deadlines. You can edit or add documents anytime from your dashboard.
                </p>
                <Link to="/dashboard" className="btn btn-primary">
                  Go to dashboard
                </Link>
                <p className="section-desc" style={{ marginTop: 16, fontSize: 13 }}>
                  You can add more items anytime from your <Link to="/dashboard" style={{ color: 'var(--accent)' }}>dashboard</Link> (Track Item or Set up step-by-step).
                </p>
              </div>
            </AppCard>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="settings-page item-setup-page">
      <PageHeader
        backTo={step === 0 ? '/dashboard' : undefined}
        onBack={step > 0 ? () => (step === 1 ? navigate(backTo || -1) : setStep(step - 1)) : undefined}
        title={step === 0 ? 'Set up an item' : `Set up ${catMeta?.name || category}`}
      />
      <main className="settings-main">
        <div className="settings-container" style={{ maxWidth: 520 }}>
          {step > 0 && (
            <div className="trust-setup-progress">
              {[1, 2, 3, 4].map((s) => (
                <span key={s} className={step >= s ? 'active' : ''}>Step {s}</span>
              ))}
            </div>
          )}

          {/* Step 0: Pick category */}
          {step === 0 && (
            <div className="trust-setup-step">
              <h3>What do you want to set up?</h3>
              <p className="step-desc">Choose a category. You&apos;ll fill in details in the next steps.</p>
              <div className="setup-category-grid">
                {APP_CONFIG.categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="setup-category-btn"
                    onClick={() => handleCategorySelect(c.id)}
                    style={{ borderColor: c.color }}
                  >
                    <span className="setup-cat-icon" style={{ background: c.color }}>{getCategoryEmoji(c.id)}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Name (and type for trust) */}
          {step === 1 && (
            <div className="trust-setup-step">
              {useTypeSelector ? (
                <>
                  <div className="trust-setup-guide">
                    <h3>{getSetupGuide('trust').title}</h3>
                    <ol>
                      {getSetupGuide('trust').steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                  <h3>What type of trust?</h3>
                  <p className="step-desc">Choose the type and give it a name so you can track it.</p>
                  <div className="form-group">
                    <label>Type</label>
                    <div className="trust-type-options">
                      {TRUST_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`trust-type-btn ${trustType === t.id ? 'selected' : ''}`}
                          onClick={() => setTrustType(t.id)}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Name for this trust</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Smith Family Trust"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="trust-setup-guide">
                    <h3>{getSetupGuide(category).title}</h3>
                    <ol>
                      {getSetupGuide(category).steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                  <h3>Name this {catMeta?.name?.toLowerCase() || 'item'}</h3>
                  <p className="step-desc">Type the name below. This is what you&apos;ll see on your dashboard.</p>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={catMeta?.name ? `e.g. My ${catMeta.name}` : 'e.g. Driver\'s License'}
                    />
                  </div>
                  {templates.length > 0 && (
                    <div className="form-group">
                      <label className="step-optional-label">Or pick a quick option (optional)</label>
                      <div className="trust-type-options">
                        {templates.slice(0, 8).map((t, i) => (
                          <button
                            key={i}
                            type="button"
                            className={`trust-type-btn ${name === (t.name || t) ? 'selected' : ''}`}
                            onClick={() => setName(t.name || t)}
                          >
                            {t.name || t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <button type="button" className="btn btn-primary" disabled={!canNextStep1} onClick={() => setStep(2)}>
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Step 2: Details (trustee/beneficiaries for trust, notes for others) */}
          {step === 2 && (
            <div className="trust-setup-step">
              {usePeopleStep ? (
                <>
                  <h3>Who&apos;s involved?</h3>
                  <p className="step-desc">Add trustee and beneficiaries so you have them on record. You can update these later.</p>
                  <div className="form-group">
                    <label>Trustee (who manages the trust)</label>
                    <input
                      type="text"
                      value={trustee}
                      onChange={(e) => setTrustee(e.target.value)}
                      placeholder="e.g. Jane Smith or ABC Trust Co."
                    />
                  </div>
                  <div className="form-group">
                    <label>Beneficiaries (who benefits)</label>
                    <textarea
                      value={beneficiaries}
                      onChange={(e) => setBeneficiaries(e.target.value)}
                      placeholder="e.g. Children: Alice, Bob. Contingent: Charity X."
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h3>Add any details you know (optional)</h3>
                  <p className="step-desc">Put numbers, dates, or reminders here so everything is in one place. You can skip and add them later from your dashboard.</p>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Registration number, key dates, who to contact..."
                      rows={3}
                    />
                  </div>
                </>
              )}
              <div className="trust-setup-step-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Due date + document */}
          {step === 3 && (
            <div className="trust-setup-step">
              <h3>When & document</h3>
              <p className="step-desc">
                {usePeopleStep ? 'When should we remind you to review this? You can link a document if you have one.' : 'Set a due or review date. You can link a document from your vault if you have one.'}
              </p>
              <div className="form-group">
                <label>{usePeopleStep ? 'Next review date' : 'Due or review date'}</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Link a document (optional)</label>
                <select value={documentId || ''} onChange={(e) => setDocumentId(e.target.value || null)}>
                  <option value="">None</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>{d.name || 'Untitled'}</option>
                  ))}
                </select>
                <Link to="/documents" className="trust-setup-doc-link" style={{ marginTop: 8, display: 'inline-block', fontSize: 13 }}>
                  <FileText size={14} /> Upload or scan in Document Vault
                </Link>
              </div>
              <div className="trust-setup-step-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & add */}
          {step === 4 && (
            <div className="trust-setup-step">
              <h3>Review and add</h3>
              <p className="step-desc">Add this to your dashboard. You&apos;ll get reminders and can attach documents anytime.</p>
              <div className="trust-setup-summary">
                <p><strong>Category:</strong> {catMeta?.name}</p>
                <p><strong>Name:</strong> {name}</p>
                {useTypeSelector && trustType && (
                  <p><strong>Type:</strong> {TRUST_TYPES.find((t) => t.id === trustType)?.label}</p>
                )}
                {usePeopleStep && trustee && <p><strong>Trustee:</strong> {trustee}</p>}
                {dueDate && <p><strong>Date:</strong> {dueDate}</p>}
              </div>
              <div className="trust-setup-step-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(3)}>Back</button>
                <button type="button" className="btn btn-primary" disabled={saving} onClick={handleFinish}>
                  {saving ? 'Adding…' : 'Add to my dashboard'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
