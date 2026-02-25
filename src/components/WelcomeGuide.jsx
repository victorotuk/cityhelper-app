import { useState, useRef, useCallback } from 'react';
import { X, ChevronRight, Check, Building2, User, Mic, MicOff } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

function QuizTextInput({ value, onChange, placeholder, maxLength = 200, className = 'quiz-other-input' }) {
  const [listening, setListening] = useState(false);
  const [speechPreview, setSpeechPreview] = useState(null);
  const recognitionRef = useRef(null);

  const toggleSpeech = useCallback((replaceAll = false) => {
    if (!SpeechRecognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (replaceAll) {
      onChange('');
      setSpeechPreview(null);
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      if (transcript.trim()) {
        onChange((replaceAll ? '' : value ? value + ' ' : '') + transcript.trim());
        setSpeechPreview(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, value, onChange]);

  return (
    <div className="quiz-text-with-mic-wrap">
      <div className="quiz-text-with-mic">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (speechPreview) setSpeechPreview(null);
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          className={className}
        />
        {SpeechRecognition && (
          <button
            type="button"
            className={`quiz-mic-btn ${listening ? 'listening' : ''}`}
            onClick={() => toggleSpeech(false)}
            title={listening ? 'Stop' : 'Speak'}
            aria-label={listening ? 'Stop listening' : 'Speak'}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}
      </div>
      {speechPreview && (
        <div className="speech-review-bar speech-review-bar-quiz">
          <span className="speech-review-text">We heard: &quot;{speechPreview.length > 40 ? speechPreview.slice(0, 40) + '…' : speechPreview}&quot;</span>
          <button type="button" className="speech-review-again" onClick={() => toggleSpeech(true)}>
            <Mic size={12} /> Speak again
          </button>
          <button type="button" className="speech-review-dismiss" onClick={() => setSpeechPreview(null)} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}

function QuizTextareaMic({ value, onChange }) {
  const [listening, setListening] = useState(false);
  const [speechPreview, setSpeechPreview] = useState(null);
  const recognitionRef = useRef(null);

  const toggleSpeech = useCallback((replaceAll = false) => {
    if (!SpeechRecognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (replaceAll) {
      onChange('');
      setSpeechPreview(null);
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      if (transcript.trim()) {
        onChange((replaceAll ? '' : value ? value + ' ' : '') + transcript.trim());
        setSpeechPreview(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, value, onChange]);

  return (
    <div className="quiz-textarea-mic-wrap">
      <button
        type="button"
        className={`quiz-mic-btn quiz-mic-btn-textarea ${listening ? 'listening' : ''}`}
        onClick={() => toggleSpeech(false)}
        title={listening ? 'Stop' : 'Speak'}
        aria-label={listening ? 'Stop listening' : 'Speak'}
      >
        {listening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      {speechPreview && (
        <div className="speech-review-bar speech-review-bar-quiz speech-review-bar-textarea">
          <span className="speech-review-text">We heard: &quot;{speechPreview.length > 40 ? speechPreview.slice(0, 40) + '…' : speechPreview}&quot;</span>
          <button type="button" className="speech-review-again" onClick={() => toggleSpeech(true)}>
            <Mic size={12} /> Speak again
          </button>
          <button type="button" className="speech-review-dismiss" onClick={() => setSpeechPreview(null)} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}

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
  { id: 'fitness', label: 'Fitness / Active', icon: '💪', desc: 'Workouts, goals, gym, running' },
  { id: 'volunteer', label: 'Volunteer', icon: '🤲', desc: 'Commitments, training, background checks' },
  { id: 'pet_owner', label: 'Pet Owner', icon: '🐾', desc: 'Vet, vaccinations, licenses, insurance' },
  { id: 'investor', label: 'Investor', icon: '📈', desc: 'Portfolio, tax docs, statements' },
  { id: 'other', label: 'Other', icon: '🔹', desc: "Something else that describes you" },
];

// ── Personal focus areas ──
const FOCUS_AREAS = [
  { id: 'deadlines', label: 'Missing deadlines', icon: '⏰' },
  { id: 'tickets', label: 'Traffic tickets, tolls & fines', icon: '🅿️' },
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
  { id: 'fitness', label: 'Workouts & fitness goals', icon: '💪' },
  { id: 'subscriptions', label: 'Subscriptions & memberships', icon: '🔄' },
  { id: 'pet_care', label: 'Pet care & vet appointments', icon: '🐕' },
  { id: 'moving', label: 'Moving & change of address', icon: '🚚' },
  { id: 'other', label: 'Other', icon: '🔹' },
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

// ── Organization focus areas ──
const ORG_FOCUS_AREAS = [
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
  { id: 'other', label: 'Other', icon: '🔹' },
];

// ── Category mappings ──
const ROLE_CATEGORIES = {
  student: ['education', 'tax', 'health', 'immigration'],
  employee: ['work_schedule', 'tax', 'health', 'driving'],
  business_owner: ['employees', 'business_tax', 'business_license', 'business_insurance', 'assets', 'liabilities', 'trust'],
  freelancer: ['tax', 'business_tax', 'professional', 'business_insurance'],
  newcomer: ['immigration', 'health', 'driving', 'housing', 'tax'],
  parent: ['health', 'education', 'housing', 'driving', 'trust'],
  homeowner: ['housing', 'property', 'tax', 'retirement_estate', 'trust'],
  renter: ['housing', 'tax'],
  driver: ['driving', 'parking'],
  landlord: ['property', 'business_tax', 'business_insurance', 'housing', 'trust'],
  retiree: ['retirement_estate', 'health', 'tax', 'trust'],
  caregiver: ['health', 'housing'],
  tradesperson: ['professional', 'business_license', 'business_insurance', 'business_tax'],
  athlete_coach: ['inst_sports', 'health'],
  healthcare: ['professional', 'health', 'inst_staff'],
  fitness: ['fitness', 'health'],
  volunteer: ['important_dates', 'health'],
  pet_owner: ['pet_care', 'health'],
  investor: ['tax', 'retirement_estate', 'trust'],
  other: ['other'],
};

const FOCUS_AREA_CATEGORIES = {
  deadlines: ['education', 'work_schedule', 'immigration'],
  tickets: ['parking', 'driving'],
  taxes: ['tax', 'business_tax'],
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
  fitness: ['fitness', 'health'],
  subscriptions: ['subscriptions'],
  pet_care: ['pet_care', 'health'],
  moving: ['moving', 'housing'],
  other: ['other'],
};

const ORG_TYPE_CATEGORIES = {
  small_business: ['business_license', 'business_tax', 'business_insurance', 'employees'],
  tech_company: ['assets', 'business_license', 'business_insurance', 'employees', 'inst_safety'],
  construction: ['business_license', 'inst_safety', 'employees', 'assets', 'professional'],
  professional_services: ['professional', 'business_tax', 'business_insurance', 'employees'],
  healthcare_org: ['inst_regulatory', 'inst_staff', 'inst_safety', 'professional', 'business_insurance'],
  school: ['inst_regulatory', 'inst_staff', 'inst_programs', 'inst_safety', 'inst_finance'],
  nonprofit: ['inst_regulatory', 'inst_finance', 'inst_legal', 'inst_staff'],
  sports_recreation: ['inst_sports', 'inst_safety', 'inst_staff', 'business_insurance'],
  property_management: ['property', 'housing', 'business_insurance', 'inst_safety'],
  transportation: ['assets', 'driving', 'business_insurance', 'employees', 'business_license'],
  manufacturing: ['assets', 'inst_safety', 'employees', 'business_license', 'inst_regulatory'],
  other: ['business_license', 'business_tax', 'employees', 'business_insurance'],
};

// ── Life moments (personal) ──
const LIFE_MOMENTS = [
  { id: 'moving', label: "I'm moving", icon: '🚚', desc: 'Change of address, utilities, mail' },
  { id: 'expecting_baby', label: 'Expecting a baby', icon: '👶', desc: 'Health, benefits, daycare' },
  { id: 'new_job', label: 'Starting a new job', icon: '💼', desc: 'Tax forms, benefits, contracts' },
  { id: 'getting_married', label: 'Getting married', icon: '💍', desc: 'Name change, benefits, estate' },
  { id: 'buying_home', label: 'Buying a home', icon: '🏠', desc: 'Mortgage, insurance, property tax' },
  { id: 'retiring', label: 'Retiring soon', icon: '🌅', desc: 'Pensions, benefits, estate planning' },
  { id: 'starting_business', label: 'Starting a business', icon: '🏪', desc: 'Licenses, taxes, insurance' },
  { id: 'getting_fit', label: 'Getting fit / Working out', icon: '💪', desc: 'Gym, running, goals, habits' },
  { id: 'other', label: "Something else", icon: '🔹', desc: "Tell the AI what you're working on" },
  { id: 'none', label: "Nothing major right now", icon: '✨', desc: 'Skip this' },
];

const LIFE_MOMENT_CATEGORIES = {
  moving: ['moving', 'housing', 'government_benefits'],
  expecting_baby: ['kids_family', 'health', 'government_benefits'],
  new_job: ['work_schedule', 'tax', 'health', 'employee_benefits'],
  getting_married: ['important_dates', 'retirement_estate', 'trust'],
  buying_home: ['housing', 'property', 'personal_insurance', 'tax'],
  retiring: ['retirement_estate', 'health', 'trust', 'government_benefits'],
  starting_business: ['business_license', 'business_tax', 'business_insurance'],
  getting_fit: ['fitness', 'health'],
  other: ['important_dates', 'health', 'education', 'other'],
  none: [],
};

const ORG_FOCUS_AREA_CATEGORIES = {
  employee_compliance: ['employees', 'inst_staff'],
  licenses_permits: ['business_license', 'inst_regulatory'],
  tax_filings: ['business_tax'],
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
  other: ['other'],
};

// ── Steps ──
// welcome(0) → accountType(1) → personal: roles(2p) → focus_areas(3p)
//                               → org: orgInfo(2o) → org_focus_areas(3o)

export default function WelcomeGuide({ userId, onComplete, existingPersona, isRetake }) {
  const existingType = existingPersona?.accountType || 'personal';
  const startStep = isRetake ? 'account_type' : 'welcome';

  const [step, setStep] = useState(startStep);
  const [accountType, setAccountType] = useState(existingType);

  // Personal flow state
  const [selectedRoles, setSelectedRoles] = useState(existingPersona?.roles || []);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState(existingPersona?.focusAreas ?? existingPersona?.struggles ?? []);
  const [lifeMoments, setLifeMoments] = useState(existingPersona?.lifeMoments || []);
  const [otherNeeds, setOtherNeeds] = useState(existingPersona?.otherNeeds || '');
  const [otherRoleDetail, setOtherRoleDetail] = useState(existingPersona?.otherRoleDetail || '');
  const [otherFocusAreaDetail, setOtherFocusAreaDetail] = useState(existingPersona?.otherFocusAreaDetail || '');
  const [otherLifeMomentDetail, setOtherLifeMomentDetail] = useState(existingPersona?.otherLifeMomentDetail || '');

  // Org flow state
  const [orgName, setOrgName] = useState(existingPersona?.orgInfo?.name || '');
  const [orgType, setOrgType] = useState(existingPersona?.orgInfo?.type || '');
  const [orgFocusAreas, setOrgFocusAreas] = useState(existingPersona?.orgFocusAreas ?? existingPersona?.orgStruggles ?? []);
  const [orgOtherNeeds, setOrgOtherNeeds] = useState(existingPersona?.orgOtherNeeds || '');
  const [orgOtherFocusAreaDetail, setOrgOtherFocusAreaDetail] = useState(existingPersona?.orgOtherFocusAreaDetail || '');
  const [orgTypeOtherDetail, setOrgTypeOtherDetail] = useState(existingPersona?.orgTypeOtherDetail || '');

  const [saving, setSaving] = useState(false);

  const toggleItem = (setter) => (id) => {
    setter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getRecommendedCategories = () => {
    const catSet = new Set();
    if (accountType === 'personal') {
      selectedRoles.forEach(r => (ROLE_CATEGORIES[r] || []).forEach(c => catSet.add(c)));
      selectedFocusAreas.forEach(s => (FOCUS_AREA_CATEGORIES[s] || []).forEach(c => catSet.add(c)));
      lifeMoments.filter(m => m !== 'none').forEach(m => (LIFE_MOMENT_CATEGORIES[m] || []).forEach(c => catSet.add(c)));
    } else {
      const effectiveOrgType = orgType || (orgTypeOtherDetail.trim() ? 'other' : '');
      (ORG_TYPE_CATEGORIES[effectiveOrgType] || []).forEach(c => catSet.add(c));
      orgFocusAreas.forEach(s => (ORG_FOCUS_AREA_CATEGORIES[s] || []).forEach(c => catSet.add(c)));
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
        ? {
            roles: selectedRoles, focusAreas: selectedFocusAreas, lifeMoments: lifeMoments.filter(m => m !== 'none'),
            otherNeeds: otherNeeds.trim() || null,
            otherRoleDetail: otherRoleDetail.trim() || null,
            otherFocusAreaDetail: otherFocusAreaDetail.trim() || null,
            otherLifeMomentDetail: otherLifeMomentDetail.trim() || null,
          }
        : {
            orgInfo: { name: orgName, type: orgType || (orgTypeOtherDetail.trim() ? 'other' : '') }, orgFocusAreas, orgOtherNeeds: orgOtherNeeds.trim() || null,
            orgOtherFocusAreaDetail: orgOtherFocusAreaDetail.trim() || null,
            orgTypeOtherDetail: orgTypeOtherDetail.trim() || null,
          }),
    };
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        persona,
        account_type: accountType,
        ...(accountType === 'organization' ? { org_info: { name: orgName, type: orgType || (orgTypeOtherDetail.trim() ? 'other' : '') } } : {}),
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
    ? ['welcome', 'account_type', 'roles', 'focus_areas', 'life_moments', 'other_needs']
    : ['welcome', 'account_type', 'org_info', 'org_focus_areas', 'other_needs'];

  const visibleSteps = isRetake ? stepOrder.slice(1) : stepOrder;
  const currentIdx = visibleSteps.indexOf(step);

  const canGoNext = () => {
    switch (step) {
      case 'account_type': return !!accountType;
      case 'roles': return selectedRoles.length > 0 || otherRoleDetail.trim().length > 0;
      case 'focus_areas': return selectedFocusAreas.length > 0 || otherFocusAreaDetail.trim().length > 0;
      case 'life_moments': return true;
      case 'org_info': return orgName.trim() && (orgType || orgTypeOtherDetail.trim().length > 0);
      case 'org_focus_areas': return orgFocusAreas.length > 0 || orgOtherFocusAreaDetail.trim().length > 0;
      case 'other_needs': return true;
      default: return true;
    }
  };

  const goNext = () => {
    if (step === 'account_type') {
      setStep(accountType === 'personal' ? 'roles' : 'org_info');
    } else if (step === 'roles') {
      setStep('focus_areas');
    } else if (step === 'focus_areas') {
      setStep('life_moments');
    } else if (step === 'life_moments') {
      setStep('other_needs');
    } else if (step === 'org_info') {
      setStep('org_focus_areas');
    } else if (step === 'org_focus_areas') {
      setStep('other_needs');
    }
  };

  const goBack = () => {
    if (step === 'roles' || step === 'org_info') {
      setStep('account_type');
    } else if (step === 'focus_areas') {
      setStep('roles');
    } else if (step === 'life_moments') {
      setStep('focus_areas');
    } else if (step === 'other_needs') {
      setStep(accountType === 'personal' ? 'life_moments' : 'org_focus_areas');
    } else if (step === 'org_focus_areas') {
      setStep('org_info');
    } else if (step === 'account_type' && !isRetake) {
      setStep('welcome');
    }
  };


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
              A few quick questions so we can show you exactly what matters. You can pick from our menu, type, or speak — whatever works.
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
            <p className="guide-description">Pick from the menu, type, or use the mic to speak — whatever works.</p>
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
            <div className="quiz-other-detail">
              <label className="quiz-other-label">Or type your own</label>
              <QuizTextInput
                value={otherRoleDetail}
                onChange={setOtherRoleDetail}
                placeholder="e.g. Content creator, gig worker, artist..."
              />
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext()}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Personal: Focus areas ── */}
        {step === 'focus_areas' && (
          <>
            <h2 className="guide-title">What do you want to keep on top of?</h2>
            <p className="guide-description">Pick from the menu, type, or use the mic to speak — whatever works.</p>
            <div className="quiz-options grid-2">
              {FOCUS_AREAS.map(s => (
                <button
                  key={s.id}
                  className={`quiz-option ${selectedFocusAreas.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleItem(setSelectedFocusAreas)(s.id)}
                >
                  <span className="quiz-option-icon">{s.icon}</span>
                  <span className="quiz-option-text">
                    <strong>{s.label}</strong>
                  </span>
                  {selectedFocusAreas.includes(s.id) && <Check size={16} className="quiz-check" />}
                </button>
              ))}
            </div>
            <div className="quiz-other-detail">
              <label className="quiz-other-label">Or type your own</label>
              <QuizTextInput
                value={otherFocusAreaDetail}
                onChange={setOtherFocusAreaDetail}
                placeholder="e.g. Domain renewals, professional dues, court dates..."
              />
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext()}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Personal: Life moments ── */}
        {step === 'life_moments' && (
          <>
            <h2 className="guide-title">What&apos;s coming up?</h2>
            <p className="guide-description">Pick from the menu, type, or use the mic to speak — whatever works.</p>
            <div className="quiz-options">
              {LIFE_MOMENTS.map(m => (
                <button
                  key={m.id}
                  className={`quiz-option ${lifeMoments.includes(m.id) ? 'selected' : ''}`}
                  onClick={() => {
                    if (m.id === 'none') {
                      setLifeMoments(['none']);
                    } else {
                      setLifeMoments(prev => prev.includes('none') ? [m.id] : prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]);
                    }
                  }}
                >
                  <span className="quiz-option-icon">{m.icon}</span>
                  <span className="quiz-option-text">
                    <strong>{m.label}</strong>
                    <small>{m.desc}</small>
                  </span>
                  {lifeMoments.includes(m.id) && <Check size={16} className="quiz-check" />}
                </button>
              ))}
            </div>
            <div className="quiz-other-detail">
              <label className="quiz-other-label">Or type your own</label>
              <QuizTextInput
                value={otherLifeMomentDetail}
                onChange={setOtherLifeMomentDetail}
                placeholder="e.g. Planning a wedding, managing a lawsuit, starting a side project..."
              />
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Other needs (personal & org) ── */}
        {step === 'other_needs' && (
          <>
            <h2 className="guide-title">Anything else?</h2>
            <p className="guide-description">
              {accountType === 'personal'
                ? "Type, use the mic to speak, or skip — we'll use this to personalize. Optional."
                : `Type, use the mic to speak, or skip — we'll tailor for ${orgName || 'your org'}. Optional.`}
            </p>
            <div className="org-name-field">
              <div className="quiz-text-with-mic quiz-textarea-wrap">
                <textarea
                  placeholder={accountType === 'personal'
                    ? "e.g. I'm planning a wedding, tracking a lawsuit, managing a rental property..."
                    : "e.g. Fleet maintenance schedules, grant reporting deadlines, accreditation renewals..."}
                  value={accountType === 'personal' ? otherNeeds : orgOtherNeeds}
                  onChange={(e) => accountType === 'personal' ? setOtherNeeds(e.target.value) : setOrgOtherNeeds(e.target.value)}
                  rows={4}
                  maxLength={500}
                  style={{ resize: 'vertical', minHeight: 80 }}
                />
                {SpeechRecognition && (
                  <QuizTextareaMic
                    value={accountType === 'personal' ? otherNeeds : orgOtherNeeds}
                    onChange={accountType === 'personal' ? setOtherNeeds : setOrgOtherNeeds}
                  />
                )}
              </div>
              <small className="field-hint">We'll use this to personalize your experience. You can skip.</small>
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={handleFinish} disabled={saving}>
                {saving ? 'Saving...' : <><Check size={18} /> Done</>}
              </button>
            </div>
          </>
        )}

        {/* ── Org: Info ── */}
        {step === 'org_info' && (
          <>
            <h2 className="guide-title">Tell us about your organization</h2>
            <p className="guide-description">Pick from the menu, type, or use the mic to speak — whatever works.</p>
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
            <div className="quiz-other-detail">
              <label className="quiz-other-label">Or type your own</label>
              <QuizTextInput
                value={orgTypeOtherDetail}
                onChange={setOrgTypeOtherDetail}
                placeholder="e.g. Co-op, franchise, association..."
              />
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext()}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── Org: Focus areas ── */}
        {step === 'org_focus_areas' && (
          <>
            <h2 className="guide-title">What does your org need to stay on top of?</h2>
            <p className="guide-description">Pick from the menu, type, or use the mic to speak — whatever works.</p>
            <div className="quiz-options grid-2">
              {ORG_FOCUS_AREAS.map(s => (
                <button
                  key={s.id}
                  className={`quiz-option ${orgFocusAreas.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleItem(setOrgFocusAreas)(s.id)}
                >
                  <span className="quiz-option-icon">{s.icon}</span>
                  <span className="quiz-option-text">
                    <strong>{s.label}</strong>
                  </span>
                  {orgFocusAreas.includes(s.id) && <Check size={16} className="quiz-check" />}
                </button>
              ))}
            </div>
            <div className="quiz-other-detail">
              <label className="quiz-other-label">Or type your own</label>
              <QuizTextInput
                value={orgOtherFocusAreaDetail}
                onChange={setOrgOtherFocusAreaDetail}
                placeholder="e.g. Grant reporting, accreditation renewals, fleet maintenance..."
              />
            </div>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext} disabled={!canGoNext()}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { ROLE_CATEGORIES, FOCUS_AREA_CATEGORIES, ORG_TYPE_CATEGORIES, ORG_FOCUS_AREA_CATEGORIES };
