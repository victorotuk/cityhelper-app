import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';
import LogoImg from '../../components/ui/LogoImg';

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="landing-nav">
      <Link to="/" className="brand">
        <div className="brand-mark">
          {(APP_CONFIG.logoImage || APP_CONFIG.logoImageDark || APP_CONFIG.logoImageLight) ? (
            <LogoImg alt="Nava" className="brand-logo-img" variant="light" />
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
      <button
        className="nav-hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className={`nav-hamburger-menu ${menuOpen ? 'open' : ''}`}>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <Link to="/auth" onClick={() => setMenuOpen(false)}>Sign in</Link>
      </div>
    </nav>
  );
}
