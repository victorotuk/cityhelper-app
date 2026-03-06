import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';

/**
 * Shared page header: home/logo (left, one tap to dashboard), title (center), back + optional actions (right).
 * Use backTo for a link back, or onBack for custom back behavior (e.g. wizard step).
 */
export default function PageHeader({
  backTo,
  onBack,
  title,
  icon,
  right,
  showHome = true,
}) {
  return (
    <header className="page-header">
      <div className="page-header-left">
        {showHome && (
          <Link
            to="/dashboard"
            className="header-home-btn"
            title="Home"
            aria-label="Go to dashboard"
          >
            {APP_CONFIG.logoImage ? (
              <img src={APP_CONFIG.logoImage} alt="" className="header-home-logo-img" />
            ) : (
              <span className="header-home-logo">{APP_CONFIG.logo}</span>
            )}
          </Link>
        )}
      </div>
      <div className="header-title">
        {icon}
        <span>{title}</span>
      </div>
      <div className="page-header-right">
        {right}
        {onBack ? (
          <button type="button" className="back-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={20} />
            Back
          </button>
        ) : backTo ? (
          <Link to={backTo} className="back-btn" aria-label="Back">
            <ArrowLeft size={20} />
            Back
          </Link>
        ) : null}
      </div>
    </header>
  );
}
