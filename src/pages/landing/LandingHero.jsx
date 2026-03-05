import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';

export default function LandingHero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-context">One place for your compliance — anywhere in the world</span>
        <h1 className="hero-title">
          Never miss a<br /><em>deadline</em> again.
        </h1>
        <p className="hero-body">{APP_CONFIG.description}</p>
        <p className="hero-body subtle">
          Build trusts, plan your estate, protect your wealth — plus visas, licenses, renewals. All encrypted so only you can see them.
        </p>
        <div className="hero-actions">
          <Link to="/auth" className="btn btn-primary btn-lg">
            Start Free <ArrowRight size={18} className="button-arrow" />
          </Link>
          <a href="#features" className="btn btn-ghost btn-lg">Learn more</a>
        </div>
      </div>
      <aside className="hero-aside">
        <div className="aside-card">
          <p className="aside-label">Your data, your keys</p>
          <p className="aside-text">
            Every document and deadline is encrypted with your password. Even we can&apos;t read it. That&apos;s the way it should be.
          </p>
        </div>
      </aside>
    </section>
  );
}
