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
      <h2><Key size={20} /> AI — Bring Your Own Key</h2>
      <p className="section-desc">
        Use your own Groq API key for AI chat. Your key stays on your device and is only sent when you use AI. Leave blank to use Nava&apos;s key (if configured).
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
