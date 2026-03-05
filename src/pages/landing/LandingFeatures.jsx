import { APP_CONFIG } from '../../lib/config';

const FEATURE_CARDS = [
  { icon: '🏛️', title: 'Trusts & Estate Planning', text: 'Build trusts, add executors, plan your legacy. Track beneficiaries, POA, and wealth structures.' },
  { icon: '🏢', title: 'Wealth Structures', text: 'Holding companies, parent companies, corporations — structure your wealth like the pros.' },
  { icon: '🔔', title: 'Smart Reminders', text: "Get alerts before deadlines — in-app, SMS (optional), or email. We won't spam you." },
  { icon: '🤖', title: 'AI Assistant', text: 'Ask about trusts, estate planning, holding companies, visas, licenses — become an expert.' },
  { icon: '📁', title: 'Document Vault', text: 'Store trust docs, licenses, receipts. Everything encrypted client-side.' },
  { icon: '🧮', title: 'Tax Estimator', text: "Know what you'll owe before filing. One tool among many." },
  { icon: '🔐', title: 'Zero-Knowledge', text: 'Your password encrypts everything. We literally cannot read your data.' },
  { icon: '📱', title: 'Works Everywhere', text: 'Web, iPhone, Android, Mac, Windows. One account, all devices.' },
];

const CATEGORY_DESCRIPTIONS = {
  immigration: 'Work permits, study permits, visitor visas, PR cards',
  trust: 'Living trusts, wills, beneficiaries, POA — protect what matters',
  tax: 'T1, T2, HST/GST, RRSP, payroll — personal and business',
  driving: 'License renewals, sticker, insurance, registration',
  parking: 'Parking tickets, toll roads (407, E-ZPass), traffic violations',
  health: 'Health cards (all provinces), medical appointments, health & dental insurance',
  fitness: 'Workouts, gym sessions, running goals, progress check-ins',
  retirement_estate: 'Wills, trusts, POA, insurance, RRSP/TFSA, beneficiaries — keep intentions aligned',
  housing: 'Lease expiry, rent increases, tenant insurance',
  office: 'Commercial lease, WSIB, payroll, business compliance',
  business_license: 'Federal registration, provincial licenses',
  property: 'Property tax, municipal permits',
  professional: 'Nursing, engineering, CPA, trade licenses',
  education: 'Exams, tuition, assignments, financial aid',
  work_schedule: 'Shifts, pay days, contract dates',
  other: 'Contracts, court dates, any other deadlines',
  subscriptions: 'Netflix, gym, software, domain renewals',
  pet_care: 'Vet visits, vaccinations, grooming, pet license',
  kids_family: 'School deadlines, immunizations, daycare',
  personal_insurance: "Auto, home, renter's insurance",
  credit_banking: 'Credit card, statements, loan payments',
  travel: 'Flights, travel insurance, Global Entry, NEXUS',
  important_dates: 'Birthdays, anniversaries, weddings, parties',
  legal_court: 'Court dates, jury duty, legal filings',
  moving: 'Change of address, mail forwarding',
  government_benefits: 'EI, CPP, OAS, tax credits',
  contracts: 'Client, vendor, NDA renewals',
  certifications: 'ISO, SOC 2, industry certs',
  patents_ip: 'Patent fees, trademark renewals',
  environmental: 'Permits, waste reporting',
  data_privacy: 'GDPR, PIPEDA, privacy reviews',
  employee_benefits: 'Health, dental, gym, education, housing, pet, trips',
};

const ICON_EMOJI_MAP = {
  Plane: '✈️', DollarSign: '💰', Building2: '🏢', Car: '🚗', ParkingCircle: '🅿️', Heart: '❤️',
  Landmark: '🏛️', Home: '🏠', Briefcase: '💼', FileText: '📋', Building: '🏛️', GraduationCap: '🎓',
  Pin: '📌', CreditCard: '💳', FileCheck: '📋', Baby: '👶', Scale: '⚖️', Truck: '🚚', Dog: '🐕',
  Shield: '🛡️', Repeat: '🔄', Award: '🏅', FileSignature: '📝', Lock: '🔒', Leaf: '🌿',
  Copyright: '©️', BookOpen: '📚', Clock: '⏰', Package: '📦', AlertTriangle: '⚠️', Users: '👥',
  Calendar: '📅', Trophy: '🏆', CalendarHeart: '📅', Gift: '🎁', Dumbbell: '💪',
};

function getCategoryEmoji(iconName) {
  return ICON_EMOJI_MAP[iconName] || '📋';
}

export default function LandingFeatures() {
  return (
    <>
      <section className="features-section" id="features">
        <div className="section-header">
          <p className="section-eyebrow">What you get</p>
          <h2 className="section-title">Everything to stay on top of your compliance</h2>
        </div>
        <div className="features-grid">
          {FEATURE_CARDS.map((card) => (
            <div key={card.title} className="feature-card">
              <div className="feature-icon">{card.icon}</div>
              <h3 className="feature-title">{card.title}</h3>
              <p className="feature-text">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <div className="section-header">
          <p className="section-eyebrow">Categories</p>
          <h2 className="section-title">Track all your compliance in one place</h2>
        </div>
        <div className="features-grid">
          {APP_CONFIG.categories.slice(0, 6).map((cat) => (
            <div key={cat.id} className="feature-card">
              <div className="feature-icon">{getCategoryEmoji(cat.icon)}</div>
              <h3 className="feature-title">{cat.name}</h3>
              <p className="feature-text">{CATEGORY_DESCRIPTIONS[cat.id] || ''}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
