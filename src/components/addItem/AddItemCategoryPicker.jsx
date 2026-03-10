import { Clipboard } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';
import { parseTextForSuggestion } from '../../lib/smartSuggestParse';
import { EMPTY_EMOJIS } from '../dashboard/constants';

function getCategoryEmoji(catId) {
  return EMPTY_EMOJIS[catId] || '📌';
}

const inGroup = (cat, g) => cat.group === g || cat.groups?.includes(g);

const CORE_IDS = new Set([
  'trust', 'retirement_estate', 'credit_banking', 'tax', 'subscriptions',
  'personal_insurance', 'housing', 'immigration', 'driving', 'parking',
  'legal_court', 'government_benefits', 'important_dates', 'kids_family',
  'education', 'travel',
]);

export default function AddItemCategoryPicker({ activeGroup, setActiveGroup, setSelectedCategory, onPasteSuggest, onSuggest }) {
  const allPersonal = APP_CONFIG.categories.filter((c) => inGroup(c, 'personal'));
  const corePersonal = allPersonal.filter((c) => CORE_IDS.has(c.id));
  const extrasPersonal = allPersonal.filter((c) => !CORE_IDS.has(c.id));

  const groupedCats = {
    personal: corePersonal,
    personal_extras: extrasPersonal,
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
      {activeGroup === 'personal' && extrasPersonal.length > 0 && (
        <>
          <p className="category-section-label">Extras</p>
          <div className="category-grid">
            {extrasPersonal.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="category-btn extra"
                onClick={() => setSelectedCategory(cat.id)}
                style={{ borderColor: cat.color }}
              >
                <span className="cat-icon" style={{ background: cat.color }}>{getCategoryEmoji(cat.id)}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
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
