import { useState } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';

const ROLES = [
  { id: 'student', label: 'Student', icon: '📚', desc: 'Exams, tuition, enrollment' },
  { id: 'employee', label: 'Employee', icon: '💼', desc: 'Work schedule, pay, contracts' },
  { id: 'business_owner', label: 'Business Owner', icon: '🏢', desc: 'Licenses, taxes, employees' },
  { id: 'newcomer', label: 'Newcomer / Immigrant', icon: '✈️', desc: 'Visas, permits, settlement' },
  { id: 'parent', label: 'Parent / Family', icon: '👨‍👩‍👧', desc: 'Health, school, housing' },
  { id: 'homeowner', label: 'Homeowner / Renter', icon: '🏡', desc: 'Bills, insurance, lease' },
  { id: 'institution_admin', label: 'School / Institution', icon: '🏛️', desc: 'Staff, accreditation, safety' },
  { id: 'freelancer', label: 'Freelancer / Self-Employed', icon: '🎯', desc: 'Invoices, taxes, clients' },
];

const STRUGGLES = [
  { id: 'deadlines', label: 'Missing deadlines', icon: '⏰' },
  { id: 'tickets', label: 'Traffic tickets & fines', icon: '🅿️' },
  { id: 'taxes', label: 'Tax filing dates', icon: '💰' },
  { id: 'renewals', label: 'Document renewals', icon: '📄' },
  { id: 'bills', label: 'Bills & payments', icon: '💸' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'compliance', label: 'Business compliance', icon: '📋' },
  { id: 'school', label: 'School deadlines', icon: '📚' },
  { id: 'employee_docs', label: 'Employee paperwork', icon: '👥' },
  { id: 'insurance', label: 'Insurance renewals', icon: '🛡️' },
];

// Map roles+struggles to recommended categories
const ROLE_CATEGORIES = {
  student: ['education', 'tax', 'health', 'immigration'],
  employee: ['work_schedule', 'tax', 'health', 'driving'],
  business_owner: ['employees', 'business_tax', 'business_license', 'business_insurance', 'assets', 'liabilities'],
  newcomer: ['immigration', 'health', 'driving', 'housing', 'tax'],
  parent: ['health', 'education', 'housing', 'driving'],
  homeowner: ['housing', 'property', 'tax', 'retirement_estate'],
  institution_admin: ['inst_regulatory', 'inst_staff', 'inst_safety', 'inst_finance', 'inst_programs'],
  freelancer: ['tax', 'business_tax', 'professional', 'business_insurance'],
};

const STRUGGLE_CATEGORIES = {
  deadlines: ['education', 'work_schedule', 'immigration'],
  tickets: ['parking', 'driving'],
  taxes: ['tax', 'business_tax'],
  renewals: ['driving', 'immigration', 'health', 'professional', 'business_license'],
  bills: ['housing', 'office'],
  appointments: ['health', 'education', 'work_schedule'],
  compliance: ['business_license', 'inst_regulatory', 'professional'],
  school: ['education'],
  employee_docs: ['employees', 'inst_staff'],
  insurance: ['business_insurance', 'inst_legal', 'health'],
};

export default function WelcomeGuide({ userId, onComplete }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=roles, 2=struggles, 3=done
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedStruggles, setSelectedStruggles] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleRole = (id) => {
    setSelectedRoles(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleStruggle = (id) => {
    setSelectedStruggles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getRecommendedCategories = () => {
    const catSet = new Set();
    selectedRoles.forEach(r => (ROLE_CATEGORIES[r] || []).forEach(c => catSet.add(c)));
    selectedStruggles.forEach(s => (STRUGGLE_CATEGORIES[s] || []).forEach(c => catSet.add(c)));
    return [...catSet];
  };

  const handleFinish = async () => {
    setSaving(true);
    const persona = {
      roles: selectedRoles,
      struggles: selectedStruggles,
      recommendedCategories: getRecommendedCategories(),
      completedOnboarding: true,
      onboardedAt: new Date().toISOString(),
    };
    try {
      await supabase.from('user_settings').upsert({
        user_id: userId,
        persona,
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
    localStorage.setItem(`welcomeGuide_${userId}`, 'true');
    onComplete?.(null);
  };

  return (
    <div className="welcome-guide-overlay">
      <div className="welcome-guide onboarding-quiz">
        <button className="guide-close" onClick={handleSkip} aria-label="Skip">
          <X size={20} />
        </button>

        {/* Progress */}
        <div className="guide-progress">
          {[0, 1, 2].map(i => (
            <div key={i} className={`progress-dot ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <>
            <div className="guide-icon"><span className="guide-emoji">🍁</span></div>
            <h2 className="guide-title">Welcome to {APP_CONFIG.name}</h2>
            <p className="guide-description">
              Let's personalize your experience. Two quick questions so we can show you exactly what matters to you.
            </p>
            <div className="guide-actions">
              <button className="btn btn-ghost" onClick={handleSkip}>Skip</button>
              <button className="btn btn-primary" onClick={() => setStep(1)}>
                Let's go <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="guide-title">What describes you?</h2>
            <p className="guide-description">Pick all that apply. This helps us show you the right stuff.</p>
            <div className="quiz-options">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  className={`quiz-option ${selectedRoles.includes(r.id) ? 'selected' : ''}`}
                  onClick={() => toggleRole(r.id)}
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
              <button className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(2)} disabled={selectedRoles.length === 0}>
                Next <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="guide-title">What do you struggle with?</h2>
            <p className="guide-description">Be honest — we'll make sure you never drop the ball on these.</p>
            <div className="quiz-options">
              {STRUGGLES.map(s => (
                <button
                  key={s.id}
                  className={`quiz-option ${selectedStruggles.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleStruggle(s.id)}
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
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={handleFinish} disabled={saving || selectedStruggles.length === 0}>
                {saving ? 'Saving...' : <><Check size={18} /> Done</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { ROLE_CATEGORIES, STRUGGLE_CATEGORIES };
