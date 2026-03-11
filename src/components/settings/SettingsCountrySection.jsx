import { useState } from 'react';
import { Globe } from 'lucide-react';
import { getUseLocationForCountry, setUseLocationForCountry } from '../../lib/countryFromLocation';

const COUNTRIES = [
  { id: 'ca', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { id: 'us', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' }
];

export default function SettingsCountrySection({
  userId,
  country,
  otherCountries,
  setCountry,
  setOtherCountries,
  saveSettings,
  handleSelectCountry,
  handleToggleOtherCountry
}) {
  const [locationToggleOverride, setLocationToggleOverride] = useState(null);
  const useLocationForCountry = locationToggleOverride !== null ? locationToggleOverride : (userId ? getUseLocationForCountry(userId) : true);

  const handleLocationToggle = (on) => {
    if (userId) setUseLocationForCountry(userId, on);
    setLocationToggleOverride(on);
  };

  return (
    <section className="settings-section">
      <h2><Globe size={20} /> Country</h2>
      <p className="section-desc">
        Select the countries you need to track compliance for. The first one you pick is your primary.
      </p>
      {userId && (
        <div className="setting-card setting-card-padded" style={{ marginBottom: 'var(--space-md)' }}>
          <div className="setting-row">
            <div className="setting-info">
              <h3>Suggest country from timezone</h3>
              <p id="country-location-desc" style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                When on, we can pre-fill your country from your device timezone (we never ask for location permission). When off, you choose below—same app, no limits either way. It&apos;s just a preference.
              </p>
            </div>
            <button
              type="button"
              className={`btn btn-sm ${useLocationForCountry ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleLocationToggle(!useLocationForCountry)}
              aria-pressed={useLocationForCountry}
              aria-label={useLocationForCountry ? 'Turn off timezone suggestion' : 'Turn on timezone suggestion'}
            >
              {useLocationForCountry ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      )}
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
