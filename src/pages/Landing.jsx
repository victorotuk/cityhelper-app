import { Link, Navigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import { useAuthStore } from '../stores/authStore';

export default function Landing() {
  const { user } = useAuthStore();

  // Redirect logged-in users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav">
        <Link to="/" className="brand">
          <div className="brand-mark">
            {APP_CONFIG.logoImage ? (
              <img src={APP_CONFIG.logoImage} alt="Nava" className="brand-logo-img" />
            ) : (
              <span>{APP_CONFIG.logo}</span>
            )}
          </div>
          <span className="brand-name">{APP_CONFIG.formalName || APP_CONFIG.name}</span>
        </Link>
        <div className="nav-actions">
          <a href="#features" className="nav-link">Features</a>
          <Link to="/auth" className="btn btn-primary btn-sm">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="landing-main">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-context">One place for your compliance — anywhere in the world</span>
            <h1 className="hero-title">
              Never miss a<br /><em>deadline</em> again.
            </h1>
            <p className="hero-body">
              {APP_CONFIG.description}
            </p>
            <p className="hero-body subtle">
              Track trusts, visas, taxes, licenses, renewals — all encrypted so only you can see them.
            </p>
            <div className="hero-actions">
              <Link to="/auth" className="btn btn-primary btn-lg">
                Start Free <ArrowRight size={18} className="button-arrow" />
              </Link>
              <a href="#features" className="btn btn-ghost btn-lg">
                Learn more
              </a>
            </div>
          </div>

          <aside className="hero-aside">
            <div className="aside-card">
              <p className="aside-label">Your data, your keys</p>
              <p className="aside-text">
                Every document and deadline is encrypted with your password. 
                Even we can't read it. That's the way it should be.
              </p>
            </div>
          </aside>
        </section>

        {/* Features */}
        <section className="features-section" id="features">
          <div className="section-header">
            <p className="section-eyebrow">What you get</p>
            <h2 className="section-title">Everything to stay on top of your compliance</h2>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3 className="feature-title">Smart Reminders</h3>
              <p className="feature-text">
                Get alerts before deadlines — in-app, SMS (optional), or email. We won't spam you.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📁</div>
              <h3 className="feature-title">Document Vault</h3>
              <p className="feature-text">
                Store tax slips, licenses, receipts. Everything encrypted client-side.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🧮</div>
              <h3 className="feature-title">Tax Estimator</h3>
              <p className="feature-text">
                Know what you'll owe before filing. No surprises in April.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Assistant</h3>
              <p className="feature-text">
                Ask questions about taxes, visas, licenses, and more — in plain English.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3 className="feature-title">Zero-Knowledge</h3>
              <p className="feature-text">
                Your password encrypts everything. We literally cannot read your data.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Works Everywhere</h3>
              <p className="feature-text">
                Web, iPhone, Android, Mac, Windows. One account, all devices.
              </p>
            </div>
          </div>
        </section>

        {/* What we track */}
        <section className="features-section">
          <div className="section-header">
            <p className="section-eyebrow">Categories</p>
            <h2 className="section-title">Track all your compliance in one place</h2>
          </div>
          
          <div className="features-grid">
            {APP_CONFIG.categories.slice(0, 6).map(cat => (
              <div key={cat.id} className="feature-card">
                <div className="feature-icon">
                  {cat.icon === 'Plane' && '✈️'}
                  {cat.icon === 'DollarSign' && '💰'}
                  {cat.icon === 'Building2' && '🏢'}
                  {cat.icon === 'Car' && '🚗'}
                  {cat.icon === 'ParkingCircle' && '🅿️'}
                  {cat.icon === 'Heart' && '❤️'}
                  {cat.icon === 'Landmark' && '🏛️'}
                  {cat.icon === 'Home' && '🏠'}
                  {cat.icon === 'Briefcase' && '💼'}
                  {cat.icon === 'FileText' && '📋'}
                  {cat.icon === 'Building' && '🏛️'}
                  {cat.icon === 'GraduationCap' && '🎓'}
                  {cat.icon === 'Pin' && '📌'}
                  {cat.icon === 'CreditCard' && '💳'}
                  {cat.icon === 'FileCheck' && '📋'}
                  {cat.icon === 'Baby' && '👶'}
                  {cat.icon === 'Scale' && '⚖️'}
                  {cat.icon === 'Truck' && '🚚'}
                  {cat.icon === 'Dog' && '🐕'}
                  {cat.icon === 'Shield' && '🛡️'}
                  {cat.icon === 'Repeat' && '🔄'}
                  {cat.icon === 'Award' && '🏅'}
                  {cat.icon === 'FileSignature' && '📝'}
                  {cat.icon === 'Lock' && '🔒'}
                  {cat.icon === 'Leaf' && '🌿'}
                  {cat.icon === 'Copyright' && '©️'}
                  {cat.icon === 'BookOpen' && '📚'}
                  {cat.icon === 'Clock' && '⏰'}
                  {cat.icon === 'Package' && '📦'}
                  {cat.icon === 'AlertTriangle' && '⚠️'}
                  {cat.icon === 'Users' && '👥'}
                  {cat.icon === 'Calendar' && '📅'}
                  {cat.icon === 'Trophy' && '🏆'}
                  {cat.icon === 'CalendarHeart' && '📅'}
                  {cat.icon === 'Gift' && '🎁'}
                </div>
                <h3 className="feature-title">{cat.name}</h3>
                <p className="feature-text">
                  {cat.id === 'immigration' && 'Work permits, study permits, visitor visas, PR cards'}
                  {cat.id === 'trust' && 'Living trusts, wills, beneficiaries, POA — protect what matters'}
                  {cat.id === 'tax' && 'T1, T2, HST/GST, RRSP, payroll — personal and business'}
                  {cat.id === 'driving' && 'License renewals, sticker, insurance, registration'}
                  {cat.id === 'parking' && 'Parking tickets, toll roads (407, E-ZPass), traffic violations'}
                  {cat.id === 'health' && 'Health cards (all provinces), medical appointments, health & dental insurance'}
                  {cat.id === 'retirement_estate' && 'Wills, trusts, POA, insurance, RRSP/TFSA, beneficiaries — keep intentions aligned'}
                  {cat.id === 'housing' && 'Lease expiry, rent increases, tenant insurance'}
                  {cat.id === 'office' && 'Commercial lease, WSIB, payroll, business compliance'}
                  {cat.id === 'business_license' && 'Federal registration, provincial licenses'}
                  {cat.id === 'property' && 'Property tax, municipal permits'}
                  {cat.id === 'professional' && 'Nursing, engineering, CPA, trade licenses'}
                  {cat.id === 'education' && 'Exams, tuition, assignments, financial aid'}
                  {cat.id === 'work_schedule' && 'Shifts, pay days, contract dates'}
                  {cat.id === 'other' && 'Contracts, court dates, any other deadlines'}
                  {cat.id === 'subscriptions' && 'Netflix, gym, software, domain renewals'}
                  {cat.id === 'pet_care' && 'Vet visits, vaccinations, grooming, pet license'}
                  {cat.id === 'kids_family' && 'School deadlines, immunizations, daycare'}
                  {cat.id === 'personal_insurance' && 'Auto, home, renter\'s insurance'}
                  {cat.id === 'credit_banking' && 'Credit card, statements, loan payments'}
                  {cat.id === 'travel' && 'Flights, travel insurance, Global Entry, NEXUS'}
                  {cat.id === 'important_dates' && 'Birthdays, anniversaries, weddings, parties'}
                  {cat.id === 'legal_court' && 'Court dates, jury duty, legal filings'}
                  {cat.id === 'moving' && 'Change of address, mail forwarding'}
                  {cat.id === 'government_benefits' && 'EI, CPP, OAS, tax credits'}
                  {cat.id === 'contracts' && 'Client, vendor, NDA renewals'}
                  {cat.id === 'certifications' && 'ISO, SOC 2, industry certs'}
                  {cat.id === 'patents_ip' && 'Patent fees, trademark renewals'}
                  {cat.id === 'environmental' && 'Permits, waste reporting'}
                  {cat.id === 'data_privacy' && 'GDPR, PIPEDA, privacy reviews'}
                  {cat.id === 'employee_benefits' && 'Health, dental, gym, education, housing, pet, trips'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="features-section">
          <div className="aside-card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className="section-title" style={{ marginBottom: '16px' }}>
              Ready to stop worrying?
            </h2>
            <p className="aside-text" style={{ marginBottom: '24px' }}>
              Start free. No credit card required. Cancel anytime.
            </p>
            <Link to="/auth" className="btn btn-primary btn-lg">
              Get started <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ 
        borderTop: '1px solid rgba(255,255,255,0.06)', 
        padding: '40px 24px', 
        textAlign: 'center' 
      }}>
        <p style={{ fontSize: '14px', color: '#6b6b70', marginBottom: '16px' }}>
          Built for the nights when you're tired of guessing which deadline you forgot.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '12px', color: '#6b6b70' }}>
          <span>© 2025 {APP_CONFIG.formalName || APP_CONFIG.name}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href="#" style={{ color: '#6b6b70' }}>Privacy</a>
          <span style={{ opacity: 0.4 }}>·</span>
          <a href="#" style={{ color: '#6b6b70' }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
