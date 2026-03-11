import { Key } from 'lucide-react';

export default function SettingsAISection({
  groqKey,
  setGroqKey,
  groqKeySaved,
  setGroqKeySaved,
  showSaved,
  storageKey
}) {
  return (
    <section className="settings-section">
      <h2><Key size={20} /> AI — Advanced</h2>
      <p className="section-desc">
        Nava AI works out of the box. Optionally use your own Groq key for higher rate limits or to keep requests off Nava&apos;s shared quota.
      </p>
      <div className="setting-card setting-card-padded">
        <input
          type="password"
          placeholder={groqKeySaved ? '••••••••••••' : 'Paste your Groq API key'}
          value={groqKey}
          onChange={(e) => setGroqKey(e.target.value)}
          className="setting-input"
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (groqKey.trim()) {
                localStorage.setItem(storageKey, groqKey.trim());
                setGroqKeySaved(true);
                setGroqKey('');
                showSaved('API key saved');
              } else {
                localStorage.removeItem(storageKey);
                setGroqKeySaved(false);
                showSaved('API key removed');
              }
            }}
          >
            {groqKey.trim() ? 'Save key' : groqKeySaved ? 'Remove key' : 'Save'}
          </button>
          {groqKeySaved && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                localStorage.removeItem(storageKey);
                setGroqKeySaved(false);
                showSaved('API key removed');
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
