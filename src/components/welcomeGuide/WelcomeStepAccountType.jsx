import { Check, ChevronRight, User, Building2 } from 'lucide-react';

export default function WelcomeStepAccountType({ accountType, setAccountType, isRetake, onBack, onNext, canGoNext }) {
  return (
    <>
      <h2 className="guide-title">Who is this for?</h2>
      <p className="guide-description">This shapes your entire experience. You can always change it later.</p>
      <div className="account-type-options">
        <button
          type="button"
          className={`account-type-card ${accountType === 'personal' ? 'selected' : ''}`}
          onClick={() => setAccountType('personal')}
        >
          <div className="atc-icon"><User size={28} /></div>
          <div className="atc-text">
            <strong>Myself</strong>
            <span>Personal compliance — taxes, health, school, driving, immigration, and more</span>
          </div>
          {accountType === 'personal' && <Check size={18} className="atc-check" />}
        </button>
        <button
          type="button"
          className={`account-type-card ${accountType === 'organization' ? 'selected' : ''}`}
          onClick={() => setAccountType('organization')}
        >
          <div className="atc-icon"><Building2 size={28} /></div>
          <div className="atc-text">
            <strong>My Organization</strong>
            <span>Business or institution — employees, assets, licenses, inspections, contracts</span>
          </div>
          {accountType === 'organization' && <Check size={18} className="atc-check" />}
        </button>
      </div>
      <div className="guide-actions">
        {isRetake ? (
          <button type="button" className="btn btn-ghost" onClick={onBack}>Cancel</button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
        )}
        <button type="button" className="btn btn-primary" onClick={onNext} disabled={!canGoNext}>
          Next <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}
