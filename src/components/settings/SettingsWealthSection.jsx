import { Link } from 'react-router-dom';
import { BookOpen, User, Package, Building2 } from 'lucide-react';

export default function SettingsWealthSection() {
  return (
    <section className="settings-section">
      <h2>Wealth & Estate</h2>
      <p className="section-desc">Build trusts, plan your estate, and manage your wealth structures.</p>
      <div className="setting-card">
        <Link to="/wealth-learn" className="setting-header link-card">
          <div className="setting-icon active"><BookOpen size={20} /></div>
          <div className="setting-info"><h3>Become an Expert</h3><p>Trusts, holding companies, wealth-building — learn the Rothschild method</p></div>
          <span className="link-arrow">→</span>
        </Link>
        <Link to="/estate" className="setting-header link-card">
          <div className="setting-icon muted"><User size={20} /></div>
          <div className="setting-info"><h3>Estate Executors & Nominees</h3><p>Executors, trustees, power of attorney</p></div>
          <span className="link-arrow">→</span>
        </Link>
        <Link to="/assets" className="setting-header link-card">
          <div className="setting-icon muted"><Package size={20} /></div>
          <div className="setting-info"><h3>Asset Inventory</h3><p>Track assets with photos</p></div>
          <span className="link-arrow">→</span>
        </Link>
        <Link to="/business" className="setting-header link-card">
          <div className="setting-icon muted"><Building2 size={20} /></div>
          <div className="setting-info"><h3>Business Entities & Locations</h3><p>Corporations, LLCs, addresses</p></div>
          <span className="link-arrow">→</span>
        </Link>
      </div>
    </section>
  );
}
