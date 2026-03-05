import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function LandingCta() {
  return (
    <section className="features-section">
      <div className="aside-card" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        <h2 className="section-title" style={{ marginBottom: '16px' }}>Ready to stop worrying?</h2>
        <p className="aside-text" style={{ marginBottom: '24px' }}>
          Start free. No credit card required. Cancel anytime.
        </p>
        <Link to="/auth" className="btn btn-primary btn-lg">
          Get started <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
