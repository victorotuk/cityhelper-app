import { Globe } from 'lucide-react';

const COUNTRIES = [
  { id: 'ca', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { id: 'us', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' }
];

export default function SettingsCountrySection({
  country,
  otherCountries,
  setCountry,
  setOtherCountries,
  saveSettings,
  handleSelectCountry,
  handleToggleOtherCountry
}) {
  return (
    <section className="settings-section">
      <h2><Globe size={20} /> Country</h2>
      <p className="section-desc">
        Select the countries you need to track compliance for. The first one you pick is your primary.
      </p>
      <div className="setting-card setting-card-padded">
        <div className="country-options">
          {COUNTRIES.map(c => {
            const isPrimary = country === c.id;
            const isOther = otherCountries.includes(c.id);
            const isSelected = isPrimary || isOther;
            return (
              <button
                key={c.id}
                type="button"
                className={`country-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (isPrimary) {
                    setCountry('');
                    saveSettings({ country: null, countries: otherCountries.length ? otherCountries : null });
                  } else if (isOther) {
                    const next = otherCountries.filter(x => x !== c.id);
                    setOtherCountries(next);
                    saveSettings({ country, countries: next.length ? next : null });
                  } else if (!country) {
                    handleSelectCountry(c.id);
                  } else {
                    handleToggleOtherCountry(c.id);
                  }
                }}
              >
                <span className="country-flag">{c.flag}</span>
                <span>{c.name}</span>
                {isPrimary && <span className="country-badge">Primary</span>}
                {isOther && <span className="country-badge other">Added</span>}
              </button>
            );
          })}
        </div>
        {!country && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Tap a country to get started. You can select both.
          </p>
        )}
      </div>
    </section>
  );
}
