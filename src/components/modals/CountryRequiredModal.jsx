import { X } from 'lucide-react';

const COUNTRIES = [
  { id: 'ca', name: 'Canada', flag: '🇨🇦' },
  { id: 'us', name: 'United States', flag: '🇺🇸' }
];

export default function CountryRequiredModal({ suggestedCountry, onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal country-required-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select your country</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="modal-body-text">
            {suggestedCountry
              ? `We think you're in ${COUNTRIES.find(c => c.id === suggestedCountry)?.name || suggestedCountry}. Tap to use it or pick the other.`
              : 'Which country do you need to track compliance for?'}
          </p>
          <div className="country-picker-inline">
            {COUNTRIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`country-pick-btn ${suggestedCountry === c.id ? 'suggested' : ''}`}
                onClick={() => onSelect(c.id)}
              >
                <span className="country-pick-flag">{c.flag}</span>
                <span className="country-pick-name">{c.name}</span>
                {suggestedCountry === c.id && <span className="country-pick-suggested">Suggested</span>}
              </button>
            ))}
          </div>
          <p className="modal-body-text soft" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '12px' }}>
            You can add more countries anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
