import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';

export default function LandingHero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-context">Track almost anything — one place, anywhere</span>
        <h1 className="hero-title">
          Never miss a<br /><em>deadline</em> again.
        </h1>
        <p className="hero-body">{APP_CONFIG.description}</p>
        <div className="hero-actions">
          <Link to="/auth" className="btn btn-primary btn-lg hero-cta-primary">
            Start Free <ArrowRight size={18} className="button-arrow" />
          </Link>
          <a href="#features" className="btn btn-ghost btn-lg hero-cta-secondary">Learn more</a>
        </div>
      </div>
      <aside className="hero-aside">
        <div className="aside-card hero-trust-card">
          <p className="aside-label">Your data, your keys</p>
          <p className="aside-text">
            Every document and deadline is encrypted with your password. Even we can&apos;t read it.
          </p>
        </div>
      </aside>
    </section>
  );
}
