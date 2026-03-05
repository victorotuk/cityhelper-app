import { ExternalLink, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const API_BASE = (import.meta.env.VITE_SUPABASE_URL || 'https://qyisjxfugogimgzhualw.supabase.co').replace(/\/$/, '');

export default function SettingsOpenClawSection({
  apiKeyLoading,
  setApiKeyLoading,
  newApiKey,
  setNewApiKey,
  apiKeyCopied,
  setApiKeyCopied,
  setError,
  showSaved
}) {
  return (
    <section className="settings-section">
      <h2><ExternalLink size={20} /> OpenClaw & API</h2>
      <p className="section-desc">
        Use Nava from messaging apps (WhatsApp, iMessage, etc.) via OpenClaw. Generate an API key and add the Nava plugin to OpenClaw.
      </p>
      <div className="setting-card setting-card-padded">
        <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>API URL (for OpenClaw config)</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <code style={{ flex: 1, minWidth: 200, padding: '8px 10px', background: 'var(--bg-muted)', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all' }}>
            {API_BASE}/functions/v1/nava-api
          </code>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              navigator.clipboard.writeText(`${API_BASE}/functions/v1/nava-api`);
              setApiKeyCopied(true);
              setTimeout(() => setApiKeyCopied(false), 2000);
            }}
          >
            <Copy size={14} /> {apiKeyCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {newApiKey ? (
          <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Your new API key (copy now — it won&apos;t be shown again):</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ flex: 1, minWidth: 200, padding: '8px 10px', background: 'var(--bg)', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all' }}>
                {newApiKey}
              </code>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  navigator.clipboard.writeText(newApiKey);
                  setApiKeyCopied(true);
                  setTimeout(() => setApiKeyCopied(false), 2000);
                }}
              >
                <Copy size={14} /> {apiKeyCopied ? 'Copied!' : 'Copy key'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewApiKey(null)}>Done</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ marginTop: '12px' }}
            disabled={apiKeyLoading}
            onClick={async () => {
              setApiKeyLoading(true);
              setError(null);
              try {
                const { data: session } = await supabase.auth.getSession();
                if (!session?.session?.access_token) throw new Error('Please sign in again');
                const res = await fetch(`${API_BASE}/functions/v1/create-api-key`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.session.access_token}`,
                  },
                  body: JSON.stringify({ name: 'OpenClaw' }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to create key');
                setNewApiKey(data.key);
                showSaved('API key created — copy it now!');
              } catch (err) {
                setError(err?.message || 'Failed to create API key');
              } finally {
                setApiKeyLoading(false);
              }
            }}
          >
            {apiKeyLoading ? 'Creating…' : 'Generate API key'}
          </button>
        )}
      </div>
    </section>
  );
}
