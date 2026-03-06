import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Landmark, Building2, Shield, TrendingUp, ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import PageHeader from '../components/ui/PageHeader';
export default function WealthLearn() {
  const navigate = useNavigate();

  const topics = [
    {
      id: 'trusts',
      icon: <Landmark size={24} />,
      title: 'Trusts',
      summary: 'Living trusts, irrevocable trusts, family trusts—they protect assets, reduce taxes, and control how wealth is distributed.',
      detail: 'Trusts hold assets for beneficiaries. A trustee manages them according to the trust terms. Living trusts can be changed while you’re alive; irrevocable trusts lock in terms (often for tax or protection). Family trusts help pass wealth to the next generation and can reduce estate taxes. Trusts shield assets from claims and give you control over who gets what and when.',
      actionLabel: 'Set up a trust',
      actionTo: '/setup/trust',
      actionPrompt: 'What do I need to know about setting up a trust?',
      trackCategory: 'trust',
      trackLabel: 'Track a trust',
    },
    {
      id: 'holding',
      icon: <Building2 size={24} />,
      title: 'Holding Companies',
      summary: 'A company whose main job is to own other companies or assets—not to run day-to-day operations.',
      detail: 'You use a holding company when you own (or plan to own) several businesses or investments and want one parent entity to own them. It separates liability, branding, and regulation between ventures. It’s the right choice when you have real operations or assets and need a structure to hold and control them. The holding company typically receives dividends, holds shares or property, and may manage strategy and financing for its subsidiaries.',
      actionLabel: 'Ask the AI',
      actionTo: '/assistant',
      actionPrompt: 'When should I use a holding company vs a shell company?',
      trackCategory: null,
      trackLabel: null,
      setupCategory: 'contracts',
      setupLabel: 'Set up a holding company',
    },
    {
      id: 'parent-subsidiary',
      icon: <Building2 size={24} />,
      title: 'Parent & Subsidiary Structures',
      summary: 'Layering companies for liability protection, tax planning, and flexibility.',
      detail: 'A parent company owns one or more subsidiaries. Each subsidiary can have its own purpose (one operating business, one holding IP, one holding property). This gives liability protection (problems in one company don’t automatically reach the others), tax planning (income and losses in the right places), and flexibility to sell or restructure one part without touching the rest.',
      actionLabel: 'Ask the AI',
      actionTo: '/assistant',
      actionPrompt: 'Explain parent and subsidiary company structures.',
      trackCategory: null,
      trackLabel: null,
      setupCategory: 'contracts',
      setupLabel: 'Set up a parent & subsidiary structure',
    },
    {
      id: 'shell',
      icon: <Shield size={24} />,
      title: 'Shell Companies',
      summary: 'A company that exists mainly on paper—little or no real business, employees, or operations.',
      detail: 'A shell company has minimal or no real activity. Legitimate uses include: a dormant or single-purpose entity for one deal or one asset, a company set up in advance before a business or deal is ready, or a conduit for a specific transaction (e.g. M&A) that may later be merged or dissolved. You generally don’t “need” a shell in the sense of a company with no real purpose—that’s what regulators and banks scrutinize. For most people, a holding company (with real substance) or a simple operating company is the right choice, not a shell.',
      actionLabel: 'Ask the AI',
      actionTo: '/assistant',
      actionPrompt: 'When would I need a shell company vs a holding company?',
      trackCategory: null,
      trackLabel: null,
      setupCategory: 'business_license',
      setupLabel: 'Set up a company',
    },
    {
      id: 'strategy',
      icon: <TrendingUp size={24} />,
      title: 'Wealth-Building Strategy',
      summary: 'Structure wealth across trusts and companies to protect it, minimize taxes, and grow it over generations.',
      detail: 'The Rothschild method: Structure wealth across trusts and companies to protect it, minimize taxes, and grow it across generations. Use trusts for family wealth and control; use holding companies to own operating businesses and assets. Layer entities where it makes sense for liability and tax. Our AI can walk you through how this might apply to your situation.',
      actionLabel: 'Walk me through it',
      actionTo: '/assistant',
      actionPrompt: 'Walk me through the Rothschild method and how to structure wealth with trusts and companies.',
      trackCategory: null,
      trackLabel: null,
      setupCategory: 'retirement_estate',
      setupLabel: 'Set up wealth planning',
    },
  ];

  const handleAction = (topic) => {
    if (topic.actionTo?.startsWith('/setup')) {
      navigate(topic.actionTo);
    }
  };

  const handleDragStart = (e, topic) => {
    if (!topic.actionPrompt) return;
    e.dataTransfer.setData('application/json', JSON.stringify({ prompt: topic.actionPrompt, title: topic.title }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTrackTrust = () => {
    navigate('/dashboard', { state: { openAddModalWithCategory: 'trust' } });
  };

  return (
    <div className="settings-page wealth-learn-page">
      <PageHeader backTo="/settings" title="Become an Expert" icon={<BookOpen size={24} />} />
      <main className="settings-main">
        <div className="settings-container wealth-learn-container">
          <div className="aside-card wealth-learn-intro">
            <h2>Wealth building through structure</h2>
            <p>
              Trusts, holding companies, parent companies, and shell companies aren&apos;t just for the ultra-wealthy.
              They&apos;re tools to protect what you have, save on taxes, and build lasting wealth.{' '}
              {APP_CONFIG.name} helps you track and plan. Drag a concept card onto the AI Help button to ask about it, or set up an item step-by-step.
            </p>
          </div>

          <h3 className="wealth-learn-concepts-title">Key concepts</h3>
          <div className="wealth-learn-topics">
            {topics.map((t) => (
              <div
                key={t.id}
                className="setting-card wealth-learn-card wealth-learn-card-draggable"
                draggable={!!t.actionPrompt}
                onDragStart={(e) => handleDragStart(e, t)}
                title={t.actionPrompt ? 'Drag to AI Help to ask about this' : undefined}
              >
                <div className="wealth-learn-card-inner">
                  <div className="wealth-learn-icon">{t.icon}</div>
                  <div className="wealth-learn-content">
                    <h4>{t.title}</h4>
                    <p className="wealth-learn-summary">{t.summary}</p>
                    <p className="wealth-learn-detail">{t.detail}</p>
                    <div className="wealth-learn-actions">
                      {t.actionTo?.startsWith('/setup') && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction(t)}
                        >
                          {t.actionLabel}
                          <ChevronRight size={14} />
                        </button>
                      )}
                      {t.trackCategory && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate('/dashboard', { state: { openAddModalWithCategory: t.trackCategory } })}
                        >
                          {t.trackLabel}
                        </button>
                      )}
                      {t.setupCategory && !t.actionTo?.startsWith('/setup') && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/setup/${t.setupCategory}`)}
                        >
                          {t.setupLabel}
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="wealth-learn-footer">
            <p>
              <Link to="/estate">Estate Executors &amp; Nominees</Link> — Name executors, trustees, and power of attorney in one place.
            </p>
            <p className="wealth-learn-disclaimer">
              This is educational. For your specific situation, consult a lawyer or accountant.
              Use {APP_CONFIG.name} to track your trusts, executors, and entities—and to learn.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
