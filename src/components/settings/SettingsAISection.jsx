import { useState } from 'react';
import { Key, ExternalLink, ChevronDown } from 'lucide-react';

const AI_PROVIDERS = [
  { id: 'groq', name: 'Groq', prefix: 'gsk_', freeSignup: 'https://console.groq.com', free: true,
    hint: 'Free — 1,000 requests/day. Best for most users.' },
  { id: 'openrouter', name: 'OpenRouter', prefix: 'sk-or-v1-', freeSignup: 'https://openrouter.ai/keys', free: true,
    hint: 'One key for 400+ models (AllenAI Olmo, Meta Llama, DeepSeek, etc.). Many free models.' },
  { id: 'openai', name: 'OpenAI', prefix: 'sk-', freeSignup: null, free: false,
    hint: 'Paid — if you already have an OpenAI subscription.' },
  { id: 'anthropic', name: 'Claude (Anthropic)', prefix: 'sk-ant-', freeSignup: null, free: false,
    hint: 'Paid — if you already have a Claude subscription. Used for scanning only; chat uses Groq.' },
  { id: 'gemini', name: 'Google Gemini', prefix: 'AI', freeSignup: 'https://aistudio.google.com/apikey', free: true,
    hint: 'Free tier available. Used for scanning only; chat uses Groq.' },
];

function detectProviderFromKey(key) {
  if (!key) return null;
  if (key.startsWith('gsk_')) return 'groq';
  if (key.startsWith('sk-or-v1-')) return 'openrouter';
  if (key.startsWith('sk-ant-')) return 'anthropic';
  if (key.startsWith('sk-')) return 'openai';
  if (key.startsWith('AI')) return 'gemini';
  return null;
}

export default function SettingsAISection({
  userId, showSaved,
}) {
  const storageKey = `nava_ai_key_${userId || ''}`;
  const providerStorageKey = `nava_ai_provider_${userId || ''}`;

  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState(() => !!localStorage.getItem(storageKey));
  const [savedProvider, setSavedProvider] = useState(() => localStorage.getItem(providerStorageKey) || '');
  const [showGuide, setShowGuide] = useState(false);

  const detectedProvider = detectProviderFromKey(apiKey);
  const providerInfo = AI_PROVIDERS.find(p => p.id === (detectedProvider || savedProvider));

  const handleSave = () => {
    if (apiKey.trim()) {
      const provider = detectProviderFromKey(apiKey.trim());
      localStorage.setItem(storageKey, apiKey.trim());
      // Also save under old key for backward compat with existing code
      if (userId) localStorage.setItem(`nava_groq_key_${userId}`, apiKey.trim());
      if (provider) {
        localStorage.setItem(providerStorageKey, provider);
        setSavedProvider(provider);
      }
      setSavedKey(true);
      setApiKey('');
      showSaved('API key saved');
    } else {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(providerStorageKey);
      if (userId) localStorage.removeItem(`nava_groq_key_${userId}`);
      setSavedKey(false);
      setSavedProvider('');
      showSaved('API key removed');
    }
  };

  const handleRemove = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(providerStorageKey);
    if (userId) localStorage.removeItem(`nava_groq_key_${userId}`);
    setSavedKey(false);
    setSavedProvider('');
    setApiKey('');
    showSaved('API key removed');
  };

  return (
    <section className="settings-section">
      <h2><Key size={20} /> AI Setup</h2>
      <p className="section-desc">
        Nava uses AI for chat and document scanning. Add your own AI key — Groq is <strong>free</strong> (no credit card). Or use any provider you already pay for.
      </p>

      <div className="setting-card setting-card-padded">
        {savedKey && savedProvider && (
          <div className="ai-provider-badge">
            <span className="ai-provider-name">
              {AI_PROVIDERS.find(p => p.id === savedProvider)?.name || savedProvider}
            </span>
            <span className="ai-provider-status">Connected</span>
          </div>
        )}

        <input
          type="password"
          placeholder={savedKey ? '••••••••••••' : 'Paste your AI API key'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="setting-input"
        />

        {detectedProvider && (
          <p className="ai-detected-hint">
            Detected: <strong>{AI_PROVIDERS.find(p => p.id === detectedProvider)?.name}</strong>
            {' — '}{AI_PROVIDERS.find(p => p.id === detectedProvider)?.hint}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
            {apiKey.trim() ? 'Save key' : savedKey ? 'Remove key' : 'Save'}
          </button>
          {savedKey && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleRemove}>
              Remove
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        className="ai-guide-toggle"
        onClick={() => setShowGuide(!showGuide)}
      >
        <ChevronDown size={16} style={{ transform: showGuide ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        <span>How to get a free AI key (2 minutes)</span>
      </button>

      {showGuide && (
        <div className="ai-setup-guide">
          <ol className="ai-guide-steps">
            <li>
              Go to{' '}
              <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">
                console.groq.com <ExternalLink size={12} />
              </a>
            </li>
            <li>Sign up with Google (no credit card needed)</li>
            <li>Click <strong>API Keys</strong> → <strong>Create API Key</strong></li>
            <li>Copy the key and paste it above</li>
          </ol>
          <p className="ai-guide-note">
            This gives you 1,000 requests/day for free — more than enough for personal use.
          </p>

          <div className="ai-other-providers">
            <p className="ai-guide-note" style={{ marginTop: '12px' }}>
              <strong>OpenRouter</strong> (openrouter.ai) gives one key for 400+ models including AllenAI Olmo and Meta Llama; many are free.
            </p>
            <p className="ai-guide-note" style={{ marginTop: '6px' }}>
              <strong>Already pay for another AI?</strong> Paste your OpenAI, Claude, or Gemini key — Nava detects it automatically.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
