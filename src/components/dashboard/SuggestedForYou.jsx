import { Plus } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';
import { EMPTY_EMOJIS, EMPTY_EXAMPLES } from './constants.js';

/**
 * Dashboard "Suggested for you" block from persona recommended categories.
 */
export default function SuggestedForYou({ persona, items, onAdd }) {
  const trackedCategories = new Set(items.map(i => i.category));

  const suggestions = (persona.recommendedCategories || [])
    .filter(catId => !trackedCategories.has(catId))
    .map(catId => APP_CONFIG.categories.find(c => c.id === catId))
    .filter(Boolean)
    .slice(0, 4);

  if (suggestions.length === 0) return null;

  return (
    <div className="suggested-section">
      <h3 className="suggested-title">Suggested for you</h3>
      <div className="suggested-cards">
        {suggestions.map(cat => (
          <button
            key={cat.id}
            className="suggested-card"
            onClick={() => onAdd(cat.id)}
            style={{ borderLeftColor: cat.color }}
          >
            <span className="suggested-icon">{EMPTY_EMOJIS[cat.id] || '📌'}</span>
            <div className="suggested-text">
              <strong>{cat.name}</strong>
              <small>{EMPTY_EXAMPLES[cat.id] || ''}</small>
            </div>
            <Plus size={16} className="suggested-add" />
          </button>
        ))}
      </div>
    </div>
  );
}
