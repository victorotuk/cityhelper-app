import { Link, useLocation } from 'react-router-dom';
import {
  LogOut, FileText, Calculator, Folder, Menu, Settings, Globe,
  ChevronDown, User, Package, Building2, Sun, Moon, LayoutDashboard,
  Plug, MessageSquarePlus
} from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';
import LogoImg from '../ui/LogoImg';
import NotificationBell from '../common/NotificationBell';

const COUNTRY_LABELS = { ca: 'Canada', us: 'United States' };
const COUNTRY_FLAGS = { ca: '🇨🇦', us: '🇺🇸' };

export { COUNTRY_LABELS, COUNTRY_FLAGS };

export default function DashboardHeader({
  user, persona, theme, toggleTheme, onSignOut,
  userCountries, activeCountry, showCountryDropdown, setShowCountryDropdown, setActiveCountryAndSave,
  showMenu, setShowMenu, setShowSuggestionBox,
}) {
  const location = useLocation();

  return (
    <>
      <header className="dashboard-header">
        <Link
          to="/dashboard"
          className="header-brand"
          onClick={(e) => {
            if (location.pathname === '/dashboard') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          {(APP_CONFIG.logoImage || APP_CONFIG.logoImageDark || APP_CONFIG.logoImageLight) ? (
            <LogoImg alt="Nava" className="header-logo-img" />
          ) : (
            <span className="header-logo">{APP_CONFIG.logo}</span>
          )}
          <span className="header-name">{APP_CONFIG.name}</span>
        </Link>
        <div className="header-actions">
          {userCountries.length >= 2 && (
            <div className="country-switcher-wrap">
              <button
                type="button"
                className="btn btn-ghost btn-sm country-switcher"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                aria-expanded={showCountryDropdown}
                aria-haspopup="listbox"
              >
                <Globe size={16} />
                <span>{COUNTRY_FLAGS[activeCountry] || ''} {COUNTRY_LABELS[activeCountry] || activeCountry}</span>
                <ChevronDown size={16} className={showCountryDropdown ? 'open' : ''} />
              </button>
              {showCountryDropdown && (
                <>
                  <div className="country-dropdown-backdrop" onClick={() => setShowCountryDropdown(false)} />
                  <div className="country-dropdown" role="listbox">
                    {userCountries.map(code => (
                      <button
                        key={code}
                        type="button"
                        className={`country-dropdown-item ${activeCountry === code ? 'active' : ''}`}
                        onClick={() => setActiveCountryAndSave(code)}
                        role="option"
                        aria-selected={activeCountry === code}
                      >
                        <span>{COUNTRY_FLAGS[code] || ''}</span>
                        <span>{COUNTRY_LABELS[code] || code}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <span className="header-email">
            {persona?.accountType === 'organization' && persona?.orgInfo?.name
              ? persona.orgInfo.name
              : user?.email}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <NotificationBell />
          <Link to="/settings" className="btn btn-ghost btn-sm" title="Settings">
            <Settings size={18} />
          </Link>
          <button className="btn btn-ghost btn-sm menu-toggle" onClick={() => setShowMenu(!showMenu)}>
            <Menu size={18} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {showMenu && (
        <div className="mobile-menu">
          <Link to="/apply" onClick={() => setShowMenu(false)}>
            <FileText size={18} /> Apply for Permits
          </Link>
          <Link to="/tax-estimator" onClick={() => setShowMenu(false)}>
            <Calculator size={18} /> Tax Estimator
          </Link>
          <Link to="/documents" onClick={() => setShowMenu(false)}>
            <Folder size={18} /> Documents
          </Link>
          <Link to="/estate" onClick={() => setShowMenu(false)}>
            <User size={18} /> Estate Executors
          </Link>
          <Link to="/assets" onClick={() => setShowMenu(false)}>
            <Package size={18} /> Asset Inventory
          </Link>
          <Link to="/business" onClick={() => setShowMenu(false)}>
            <Building2 size={18} /> Business Entities
          </Link>
          <Link to="/integrations" onClick={() => setShowMenu(false)}>
            <Plug size={18} /> Integrations
          </Link>
          <Link to="/settings" onClick={() => setShowMenu(false)}>
            <Settings size={18} /> Settings
          </Link>
          <button onClick={() => { setShowSuggestionBox(true); setShowMenu(false); }}>
            <MessageSquarePlus size={18} /> Suggest something to track
          </button>
        </div>
      )}
    </>
  );
}
