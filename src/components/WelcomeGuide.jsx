import { useState } from 'react';
import { X, ChevronRight, Check, Building2, User } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';

// ── Personal roles ──
const ROLES = [
  { id: 'student', label: 'Student', icon: '📚', desc: 'Exams, tuition, enrollment' },
  { id: 'employee', label: 'Employee', icon: '💼', desc: 'Work schedule, pay, contracts' },
  { id: 'business_owner', label: 'Business Owner', icon: '🏢', desc: 'Licenses, taxes, employees' },
  { id: 'freelancer', label: 'Freelancer / Self-Employed', icon: '🎯', desc: 'Invoices, taxes, clients' },
  { id: 'newcomer', label: 'Newcomer / Immigrant', icon: '✈️', desc: 'Visas, permits, settlement' },
  { id: 'parent', label: 'Parent / Family', icon: '👨‍👩‍👧', desc: 'Kids, health, school, housing' },
  { id: 'homeowner', label: 'Homeowner', icon: '🏠', desc: 'Mortgage, property tax, maintenance' },
  { id: 'renter', label: 'Renter', icon: '🏡', desc: 'Lease, bills, tenant insurance' },
  { id: 'driver', label: 'Driver', icon: '🚗', desc: 'License, registration, tickets' },
  { id: 'landlord', label: 'Landlord / Property Owner', icon: '🔑', desc: 'Tenants, inspections, permits' },
  { id: 'retiree', label: 'Retiree / Senior', icon: '🌅', desc: 'Pensions, benefits, health' },
  { id: 'caregiver', label: 'Caregiver', icon: '🤝', desc: 'Appointments, medications, paperwork' },
  { id: 'tradesperson', label: 'Tradesperson / Contractor', icon: '🔧', desc: 'Certifications, permits, safety' },
  { id: 'athlete_coach', label: 'Athlete / Coach', icon: '🏆', desc: 'Registrations, certifications, schedules' },
  { id: 'healthcare', label: 'Healthcare Worker', icon: '⚕️', desc: 'Licenses, training, certifications' },
];

// ── Personal struggles ──
const STRUGGLES = [
  { id: 'deadlines', label: 'Missing deadlines', icon: '⏰' },
  { id: 'tickets', label: 'Traffic tickets & fines', icon: '🅿️' },
  { id: 'taxes', label: 'Tax filing dates', icon: '💰' },
  { id: 'renewals', label: 'Document renewals (license, passport, etc.)', icon: '📄' },
  { id: 'bills', label: 'Bills & payments', icon: '💸' },
  { id: 'appointments', label: 'Appointments & bookings', icon: '📅' },
  { id: 'visa_immigration', label: 'Visa & immigration paperwork', icon: '✈️' },
  { id: 'school', label: 'School & exam deadlines', icon: '📚' },
  { id: 'vehicle', label: 'Vehicle registration & maintenance', icon: '🚗' },
  { id: 'compliance', label: 'Business compliance & filings', icon: '📋' },
  { id: 'employee_docs', label: 'Employee paperwork & onboarding', icon: '👥' },
  { id: 'insurance', label: 'Insurance renewals', icon: '🛡️' },
  { id: 'lease_rent', label: 'Lease & rent deadlines', icon: '🏡' },
  { id: 'government', label: 'Government forms & applications', icon: '🏛️' },
  { id: 'health', label: 'Health appointments & prescriptions', icon: '❤️' },
  { id: 'kids', label: "Kids' school & activities", icon: '👧' },
  { id: 'contracts', label: 'Contracts & agreements', icon: '📝' },
  { id: 'certifications', label: 'Professional certifications & training', icon: '🎓' },
  { id: 'estate', label: 'Estate planning & wills', icon: '📜' },
  { id: 'equipment', label: 'Equipment & asset tracking', icon: '📦' },
];

// ── Organization types ──
const ORG_TYPES = [
  { id: 'small_business', label: 'Small Business', icon: '🏪', desc: 'Retail, restaurant, service' },
  { id: 'tech_company', label: 'Tech / Equipment Company', icon: '⚙️', desc: 'Hardware, IoT, security systems' },
  { id: 'construction', label: 'Construction / Trades', icon: '🏗️', desc: 'Contractors, builders, trades' },
  { id: 'professional_services', label: 'Professional Services', icon: '💼', desc: 'Law, accounting, consulting' },
  { id: 'healthcare_org', label: 'Healthcare / Clinic', icon: '🏥', desc: 'Clinic, dental, pharmacy' },
  { id: 'school', label: 'School / Educational', icon: '🎓', desc: 'K-12, college, training center' },
  { id: 'nonprofit', label: 'Nonprofit / Charity', icon: '💚', desc: 'Foundation, community org' },
  { id: 'sports_recreation', label: 'Sports / Recreation', icon: '🏆', desc: 'League, gym, club' },
  { id: 'property_management', label: 'Property Management', icon: '🏢', desc: 'Buildings, rentals, facilities' },
  { id: 'transportation', label: 'Transportation / Logistics', icon: '🚛', desc: 'Fleet, delivery, shipping' },
  { id: 'manufacturing', label: 'Manufacturing', icon: '🏭', desc: 'Production, assembly, warehouse' },
  { id: 'other', label: 'Other', icon: '🔹', desc: 'Something else' },
];

// ── Organization struggles ──
const ORG_STRUGGLES = [
  { id: 'employee_compliance', label: 'Employee docs & compliance', icon: '👥' },
  { id: 'licenses_permits', label: 'Licenses & permits expiring', icon: '📋' },
  { id: 'tax_filings', label: 'Tax filings & deadlines', icon: '💰' },
  { id: 'insurance_coverage', label: 'Insurance renewals', icon: '🛡️' },
  { id: 'asset_maintenance', label: 'Equipment maintenance & warranties', icon: '🔧' },
  { id: 'vendor_contracts', label: 'Vendor contracts & renewals', icon: '📝' },
  { id: 'safety_inspections', label: 'Safety inspections & audits', icon: '🔍' },
  { id: 'certifications_training', label: 'Staff certifications & training', icon: '🎓' },
  { id: 'regulatory_reporting', label: 'Regulatory reporting', icon: '🏛️' },
  { id: 'lease_property', label: 'Lease & property deadlines', icon: '🏢' },
  { id: 'fleet_vehicles', label: 'Fleet & vehicle compliance', icon: '🚗' },
  { id: 'accreditation', label: 'Accreditation & audits', icon: '✅' },
  { id: 'financial_obligations', label: 'Loans, debts & obligations', icon: '💸' },
  { id: 'data_privacy', label: 'Data & privacy compliance', icon: '🔒' },
];

// ── Category mappings ──
const ROLE_CATEGORIES = {
  student: ['education', 'trust', 'health', 'immigration'],
  employee: ['work_schedule', 'trust', 'health', 'driving'],
  business_owner: ['employees', 'business_trust', 'business_license', 'business_insurance', 'assets', 'liabilities'],
  freelancer: ['trust', 'business_trust', 'professional', 'business_insurance'],
  newcomer: ['immigration', 'health', 'driving', 'housing', 'trust'],
  parent: ['health', 'education', 'housing', 'driving'],
  homeowner: ['housing', 'property', 'trust', 'retirement_estate'],
  renter: ['housing', 'trust'],
  driver: ['driving', 'parking'],
  landlord: ['property', 'business_trust', 'business_insurance', 'housing'],
  retiree: ['retirement_estate', 'health', 'trust'],
  caregiver: ['health', 'housing'],
  tradesperson: ['professional', 'business_license', 'business_insurance', 'business_trust'],
  athlete_coach: ['inst_sports', 'health'],
  healthcare: ['professional', 'health', 'inst_staff'],
};

const STRUGGLE_CATEGORIES = {
  deadlines: ['education', 'work_schedule', 'immigration'],
  tickets: ['parking', 'driving'],
  taxes: ['trust', 'business_trust'],
  renewals: ['driving', 'immigration', 'health', 'professional', 'business_license'],
  bills: ['housing', 'office'],
  appointments: ['health', 'education', 'work_schedule'],
  visa_immigration: ['immigration'],
  school: ['education'],
  vehicle: ['driving', 'parking'],
  compliance: ['business_license', 'inst_regulatory', 'professional'],
  employee_docs: ['employees', 'inst_staff'],
  insurance: ['business_insurance', 'inst_legal', 'health'],
  lease_rent: ['housing'],
  government: ['immigration', 'business_license', 'inst_regulatory'],
  health: ['health'],
  kids: ['education', 'health'],
  contracts: ['employees', 'office', 'housing'],
  certifications: ['professional', 'inst_staff'],
  estate: ['retirement_estate', 'trust'],
  equipment: ['assets'],
};

const ORG_TYPE_CATEGORIES = {
  small_business: ['business_license', 'business_trust', 'business_insurance', 'employees'],
  tech_company: ['assets', 'business_license', 'business_insurance', 'employees', 'inst_safety'],
  construction: ['business_license', 'inst_safety', 'employees', 'assets', 'professional'],
  professional_services: ['professional', 'business_trust', 'business_insurance', 'employees'],
  healthcare_org: ['inst_regulatory', 'inst_staff', 'inst_safety', 'professional', 'business_insurance'],
  school: ['inst_regulatory', 'inst_staff', 'inst_programs', 'inst_safety', 'inst_finance'],
  nonprofit: ['inst_regulatory', 'inst_finance', 'inst_legal', 'inst_staff'],
  sports_recreation: ['inst_sports', 'inst_safety', 'inst_staff', 'business_insurance'],
  property_management: ['property', 'housing', 'business_insurance', 'inst_safety'],
  transportation: ['assets', 'driving', 'business_insurance', 'employees', 'business_license'],
  manufacturing: ['assets', 'inst_safety', 'employees', 'business_license', 'inst_regulatory'],
  other: ['business_license', 'business_trust', 'employees', 'business_insurance'],
};

const ORG_STRUGGLE_CATEGORIES = {
  employee_compliance: ['employees', 'inst_staff'],
  licenses_permits: ['business_license', 'inst_regulatory'],
  tax_filings: ['business_trust'],
  insurance_coverage: ['business_insurance', 'inst_legal'],
  asset_maintenance: ['assets'],
  vendor_contracts: ['office', 'liabilities'],
  safety_inspections: ['inst_safety'],
  certifications_training: ['professional', 'inst_staff'],
  regulatory_reporting: ['inst_regulatory', 'inst_finance'],
  lease_property: ['property', 'housing', 'office'],
  fleet_vehicles: ['assets', 'driving'],
  accreditation: ['inst_regulatory'],
  financial_obligations: ['liabilities', 'inst_finance'],
  data_privacy: ['inst_regulatory'],
};

// ── Steps ──
// welcome(0) → accountType(1) → personal: roles(2p) → struggles(3p)
//                               → org: orgInfo(2o) → orgStruggles(3o)

export default function WelcomeGuide({ userId, onComplete, existingPersona, isRetake }) {
  const existingType = existingPersona?.accountType || 'personal';
  const startStep = isRetake ? 'account_type' : 'welcome';

  const [step, setStep] = useState(startStep);
  const [accountType, setAccountType] = useState(existingType);

  // Personal flow state
  const [selectedRoles, setSelectedRoles] = useState(existingPersona?.roles || []);
  const [selectedStruggles, setSelectedStruggles] = useState(existingPersona?.struggles || []);

  // Org flow state
  const [orgName, setOrgName] = useState(existingPersona?.orgInfo?.name || '');
  const [orgType, setOrgType] = useState(existingPersona?.orgInfo?.type || '');
  const [orgStruggles, setOrgStruggles] = useState(existingPersona?.orgStruggles || []);

  const [saving, setSaving] = useState(false);

  const toggleItem = (setter) => (id) => {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getRecommendedCategories = () => {
    const catSet = new Set();
    if (accountType === 'personal') {
      selectedRoles.forEach(r => (ROLE_CATEGORIES[r] || []).forEach(c => catSet.add(c)));
      selectedStruggles.forEach(s => (STRUGGLE_CATEGORIES[s] || []).forEach(c => catSet.add(c)));
    } else {
      (ORG_TYPE_CATEGORIES[orgType] || []).forEach(c => catSet.add(c));
      orgStruggles.forEach(s => (ORG_STRUGGLE_CATEGORIES[s] || []).forEach(c => catSet.add(c)));
    }
    return [...catSet];
  };

  const handleFinish = async () => {
    setSaving(true);
    const persona = {
      accountType,
      completedOnboarding: true,
      onboardedAt: new Date().toISOString(),
      recommendedCategories: getRecommendedCategories(),
      ...(accountType === 'personal'
        ? { roles: selectedRoles, struggles: selectedStruggles }
        : { orgInfo: { name: orgName, type: orgType }, orgStruggles }),
    };
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        persona,
        account_type: accountType,
        ...(accountType === 'organization' ? { org_info: { name: orgName, type: orgType } } : {}),
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.error('Failed to save persona:', err);
    }
    localStorage.setItem(`welcomeGuide_${userId}`, 'true');
    setSaving(false);
    onComplete?.(persona);
  };

  const handleSkip = () => {
    if (!isRetake) {
      localStorage.setItem(`welcomeGuide_${userId}`, 'true');
    }
    onComplete?.(null);
  };

  const stepOrder = accountType === 'personal'
    ? ['welcome', 'account_type', 'roles', 'struggles']
    : ['welcome', 'account_type', 'org_info', 'org_struggles'];

  const visibleSteps = isRetake ? stepOrder.slice(1) : stepOrder;
  const currentIdx = visibleSteps.indexOf(step);

  const canGoNext = () => {
    switch (step) {
      case 'account_type': return !!accountType;
      case 'roles': return selectedRoles.length > 0;
      case 'struggles': return selectedStruggles.length > 0;
      case 'org_info': return orgName.trim() && orgType;
      case 'org_struggles': return orgStruggles.length > 0;
      default: return true;
    }
  };

  const goNext = () => {
    if (step === 'account_type') {
      setStep(accountType === 'personal' ? 'roles' : 'org_info');
    } else if (step === 'roles') {
      setStep('struggles');
    } else if (step === 'org_info') {
      setStep('org_struggles');
    }
  };

  const goBack = () => {
    if (step === 'roles' || step === 'org_info') {
      setStep('account_type');
    } else if (step === 'struggles') {
      setStep('roles');
    } else if (step === 'org_struggles') {
      setStep('org_info');
    } else if (step === 'account_type' && !isRetake) {
      setStep('welcome');
    }
  };

  const isLastStep = step === 'struggles' || step === 'org_struggles';

  return (
    <div className="welcome-guide-overlay">
      <div className="welcome-guide onboarding-quiz">
        <button className="guide-close" onClick={handleSkip} aria-label="Skip">
          <X size={20} />
        </button>

        {/* Progress */}
        <div className="guide-progress">
          {visibleSteps.map((s, i) => (
            <div key={s} className={`progress-dot ${s === step ? 'active' : ''} ${i < currentIdx ? 'completed' : ''}`} />
          ))}
        </div>

        {/* ── Welcome ── */}
        {step === 'welcome' && (
          <>
            <div className="guide-icon"><span className="guide-emoji">🍁</span></div>
            <h2 className="guide-title">Welcome to {APP_CONFIG.name}</h2>
            <p className="guide-description">
              Let's set things up for you. A few quick questions so we can show you exactly what matters.
            </p>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={handleSkip}>Skip</button>
              <button className="btn btn-primary" onClick={() => setStep('account_type')}>
                Let's go <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Account type ── */}
        {step === 'account_type' && (
          <>
            <h2 className="guide-title">Who is this for?</h2>
            <p className="guide-description">This shapes your entire experience. You can always change it later.</p>
            <div className="account-type-options">
              <button
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
              {isRetake
                ? <button className="btn btn-ghost" onClick={handleSkip}>Cancel</button>
                : <button className="btn btn-ghost" onClick={() => setStep('welcome')}>Back</button>}
              <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext()}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Personal: Roles ── */}
        {step === 'roles' && (
          <>
            <h2 className="guide-title">What describes you?</h2>
            <p className="guide-description">Pick all that apply. This helps us show you the right stuff.</p>
            <div className="quiz-options">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  className={`quiz-option ${selectedRoles.includes(r.id) ? 'selected' : ''}`}
                  onClick={() => toggleItem(setSelectedRoles)(r.id)}
                >
                  <span className="quiz-option-icon">{r.icon}</span>
                  <span className="quiz-option-text">
                    <strong>{r.label}</strong>
                    <small>{r.desc}</small>
                  </span>
                  {selectedRoles.includes(r.id) && <Check size={16} className="quiz-check" />}
                </button>
              ))}
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext()}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Personal: Struggles ── */}
        {step === 'struggles' && (
          <>
            <h2 className="guide-title">What do you struggle with?</h2>
            <p className="guide-description">Be honest — we'll make sure you never drop the ball on these.</p>
            <div className="quiz-options grid-2">
              {STRUGGLES.map(s => (
                <button
                  key={s.id}
                  className={`quiz-option ${selectedStruggles.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleItem(setSelectedStruggles)(s.id)}
                >
                  <span className="quiz-option-icon">{s.icon}</span>
                  <span className="quiz-option-text">
                    <strong>{s.label}</strong>
                  </span>
                  {selectedStruggles.includes(s.id) && <Check size={16} className="quiz-check" />}
                </button>
              ))}
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={handleFinish} disabled={saving || !canGoNext()}>
                {saving ? 'Saving...' : <><Check size={18} /> Done</>}
              </button>
            </div>
          </>
        )}

        {/* ── Org: Info ── */}
        {step === 'org_info' && (
          <>
            <h2 className="guide-title">Tell us about your organization</h2>
            <p className="guide-description">We'll tailor everything to your industry and needs.</p>
            <div className="org-name-field">
              <label htmlFor="org-name">Organization name</label>
              <input
                id="org-name"
                type="text"
                placeholder="e.g. Maple Street Dental, CityTech Solutions"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>
            <p className="quiz-sublabel">What type of organization?</p>
            <div className="quiz-options">
              {ORG_TYPES.map(t => (
                <button
                  key={t.id}
                  className={`quiz-option ${orgType === t.id ? 'selected' : ''}`}
                  onClick={() => setOrgType(t.id)}
                >
                  <span className="quiz-option-icon">{t.icon}</span>
                  <span className="quiz-option-text">
                    <strong>{t.label}</strong>
                    <small>{t.desc}</small>
                  </span>
                  {orgType === t.id && <Check size={16} className="quiz-check" />}
                </button>
              ))}
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext()}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Org: Struggles ── */}
        {step === 'org_struggles' && (
          <>
            <h2 className="guide-title">What keeps your team up at night?</h2>
            <p className="guide-description">Pick the compliance headaches we can solve for {orgName || 'your org'}.</p>
            <div className="quiz-options grid-2">
              {ORG_STRUGGLES.map(s => (
                <button
                  key={s.id}
                  className={`quiz-option ${orgStruggles.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleItem(setOrgStruggles)(s.id)}
                >
                  <span className="quiz-option-icon">{s.icon}</span>
                  <span className="quiz-option-text">
                    <strong>{s.label}</strong>
                  </span>
                  {orgStruggles.includes(s.id) && <Check size={16} className="quiz-check" />}
                </button>
              ))}
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={handleFinish} disabled={saving || !canGoNext()}>
                {saving ? 'Saving...' : <><Check size={18} /> Done</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { ROLE_CATEGORIES, STRUGGLE_CATEGORIES, ORG_TYPE_CATEGORIES, ORG_STRUGGLE_CATEGORIES };
