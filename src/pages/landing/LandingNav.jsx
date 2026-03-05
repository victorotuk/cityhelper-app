import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../lib/config';

export default function LandingNav() {
  return (
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
        <Link to="/auth" className="btn btn-primary btn-sm">Sign in</Link>
      </div>
    </nav>
  );
}
