import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';
import { EMPTY_EMOJIS, EMPTY_EXAMPLES } from './constants.js';

/**
 * Dashboard empty state with category suggestions (group tabs).
 */
export default function EmptyState({
  requireCountryForTracking,
  setShowAddModal,
  setSelectedCategory,
  persona
}) {
  const isOrg = persona?.accountType === 'organization';
  const defaultTab = isOrg ? 'business' : 'personal';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const groups = isOrg
    ? [
        { id: 'business', label: 'Business', icon: '💼' },
        { id: 'institution', label: 'Institution', icon: '🏛️' },
        { id: 'personal', label: 'Personal', icon: '👤' },
      ]
    : [
        { id: 'personal', label: 'Personal', icon: '👤' },
        { id: 'business', label: 'Business', icon: '💼' },
        { id: 'institution', label: 'Institution', icon: '🏛️' },
      ];
  const cats = APP_CONFIG.categories.filter(c => c.group === activeTab || c.groups?.includes(activeTab));

  const orgName = persona?.orgInfo?.name;
  const headline = isOrg
    ? `${orgName ? orgName + ', everything' : 'Everything'} in order`
    : 'Your life, completely in order';

  return (
    <div className="empty-state">
      <Calendar size={48} />
      <h3>{headline}</h3>
      <p>Never miss a deadline, payment, or renewal again. What do you need to track?</p>
      <div className="empty-group-tabs">
        {groups.map(g => (
          <button
            key={g.id}
            className={`empty-group-tab ${activeTab === g.id ? 'active' : ''}`}
            onClick={() => setActiveTab(g.id)}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>
      <div className="category-suggestions">
        {cats.map(cat => (
          <button
            key={cat.id}
            className="category-suggestion"
            onClick={() => { requireCountryForTracking(() => { setShowAddModal(true); setSelectedCategory(cat.id); }); }}
          >
            <span className="cat-sug-icon">{EMPTY_EMOJIS[cat.id] || '📌'}</span>
            <span className="cat-sug-name">{cat.name}</span>
            <span className="cat-sug-examples">{EMPTY_EXAMPLES[cat.id] || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
