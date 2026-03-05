import { Clipboard } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';
import { parseTextForSuggestion } from '../../lib/smartSuggestParse';

const CATEGORY_EMOJIS = {
  immigration: '✈️', trust: '🏛️', tax: '💰', driving: '🚗', parking: '🅿️', health: '❤️', fitness: '💪',
  education: '📚', work_schedule: '⏰', retirement_estate: '📜', housing: '🏡',
  business_tax: '💰', employees: '👥', assets: '📦', liabilities: '⚠️',
  business_insurance: '🛡️', office: '💼', business_license: '📋', property: '🏠', professional: '🎓', other: '📌',
  subscriptions: '🔄', pet_care: '🐕', kids_family: '👶', personal_insurance: '🛡️',
  credit_banking: '💳', travel: '✈️', important_dates: '📅', legal_court: '⚖️', moving: '🚚', government_benefits: '📋',
  contracts: '📝', certifications: '🏅', patents_ip: '©️', environmental: '🌿', data_privacy: '🔒',
  employee_benefits: '🎁',
  inst_regulatory: '🏛️', inst_staff: '👨‍🏫', inst_student: '🎓', inst_finance: '💰',
  inst_safety: '🔥', inst_facilities: '🔧', inst_legal: '⚖️', inst_programs: '📖', inst_sports: '🏆',
};

function getCategoryEmoji(catId) {
  return CATEGORY_EMOJIS[catId] || '📌';
}

const inGroup = (cat, g) => cat.group === g || cat.groups?.includes(g);

export default function AddItemCategoryPicker({ activeGroup, setActiveGroup, setSelectedCategory, onPasteSuggest, onSuggest }) {
  const groupedCats = {
    personal: APP_CONFIG.categories.filter((c) => inGroup(c, 'personal')),
    business: APP_CONFIG.categories.filter((c) => inGroup(c, 'business')),
    institution: APP_CONFIG.categories.filter((c) => inGroup(c, 'institution')),
  };
  const visibleCategories = groupedCats[activeGroup] || groupedCats.personal;

  const handlePaste = async () => {
    try {
      const t = await navigator.clipboard?.readText?.();
      if (!t) return;
      const s = parseTextForSuggestion(t);
      if (s) onPasteSuggest(s);
    } catch { /* clipboard denied */ }
  };

  return (
    <div className="category-picker">
      <div className="group-tabs">
        <button
          type="button"
          className={`group-tab ${activeGroup === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveGroup('personal')}
        >
          <span className="group-tab-icon">👤</span> Personal
        </button>
        <button
          type="button"
          className={`group-tab ${activeGroup === 'business' ? 'active' : ''}`}
          onClick={() => setActiveGroup('business')}
        >
          <span className="group-tab-icon">💼</span> Business
        </button>
        <button
          type="button"
          className={`group-tab ${activeGroup === 'institution' ? 'active' : ''}`}
          onClick={() => setActiveGroup('institution')}
        >
          <span className="group-tab-icon">🏛️</span> Institution
        </button>
      </div>
      <div className="category-grid">
        {visibleCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className="category-btn"
            onClick={() => setSelectedCategory(cat.id)}
            style={{ borderColor: cat.color }}
          >
            <span className="cat-icon" style={{ background: cat.color }}>{getCategoryEmoji(cat.id)}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
      <div className="paste-suggest-row">
        <button type="button" className="btn btn-ghost btn-sm paste-suggest-btn" onClick={handlePaste}>
          <Clipboard size={16} /> Paste from clipboard & suggest
        </button>
      </div>
      {onSuggest && (
        <p className="add-modal-suggest">
          Don&apos;t see what you need? <button type="button" className="link-btn" onClick={onSuggest}>Suggest something to track</button>
        </p>
      )}
    </div>
  );
}
