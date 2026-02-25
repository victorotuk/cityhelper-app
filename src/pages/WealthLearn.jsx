import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Landmark, Building2, Shield, TrendingUp } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';

export default function WealthLearn() {
  const topics = [
    {
      icon: <Landmark size={24} />,
      title: 'Trusts',
      desc: 'Living trusts, irrevocable trusts, family trusts — protect assets, reduce taxes, control distribution. Learn how trusts shield wealth and pass it to beneficiaries.',
    },
    {
      icon: <Building2 size={24} />,
      title: 'Holding Companies',
      desc: 'Own assets through a holding company. Separate operating risk from wealth. Defer and optimize taxes. The foundation of many wealth structures.',
    },
    {
      icon: <Building2 size={24} />,
      title: 'Parent & Subsidiary Structures',
      desc: 'Layer companies for liability protection, tax planning, and operational flexibility. Parent owns subsidiaries; each has a purpose.',
    },
    {
      icon: <Shield size={24} />,
      title: 'Shell Companies',
      desc: 'Legal entities with no active business — used for holding assets, IP, or as part of larger structures. Understand when and how they fit.',
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Wealth-Building Strategy',
      desc: 'The Rothschild method: structure wealth across trusts and companies to protect it, minimize taxes, and grow it across generations. Ask our AI to walk you through it.',
    },
  ];

  return (
    <div className="settings-page">
      <header className="page-header">
        <Link to="/settings" className="back-btn"><ArrowLeft size={20} /> Back</Link>
        <div className="header-title"><BookOpen size={24} /><span>Become an Expert</span></div>
        <div style={{ width: 80 }} />
      </header>
      <main className="settings-main">
        <div className="settings-container" style={{ maxWidth: 640 }}>
          <div className="aside-card" style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>Wealth building through structure</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Trusts, holding companies, parent companies, and shell companies aren't just for the ultra-wealthy. 
              They're tools to protect what you have, save on taxes, and build lasting wealth. 
              {APP_CONFIG.name} helps you track and plan — and our AI can guide you through the concepts.
            </p>
            <Link to="/assistant" className="btn btn-primary" style={{ marginTop: 16 }}>
              Ask the AI: &quot;How do I set up a trust?&quot;
            </Link>
          </div>

          <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Key concepts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {topics.map((t, i) => (
              <div key={i} className="setting-card" style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{t.icon}</div>
                  <div>
                    <h4 style={{ marginBottom: 4 }}>{t.title}</h4>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 'var(--space-xl)', fontSize: 13, color: 'var(--text-muted)' }}>
            This is educational. For your specific situation, consult a lawyer or accountant. 
            Use {APP_CONFIG.name} to track your trusts, executors, and entities — and to learn.
          </p>
        </div>
      </main>
    </div>
  );
}
