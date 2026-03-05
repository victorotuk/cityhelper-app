import { useState } from 'react';
import { ExternalLink, Copy, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const API_BASE = (import.meta.env.VITE_SUPABASE_URL || 'https://qyisjxfugogimgzhualw.supabase.co').replace(/\/$/, '');
const NAVA_API_URL = `${API_BASE}/functions/v1/nava-api`;

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
  const [showHelp, setShowHelp] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(NAVA_API_URL);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(newApiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const copyFullSetup = () => {
    const block = `# Paste this into your OpenClaw config (e.g. ~/.openclaw/config.yaml)
plugins:
  entries:
    nava:
      enabled: true
      config:
        api_url: "${NAVA_API_URL}"
        api_key: "${newApiKey}"`;
    navigator.clipboard.writeText(block);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  return (
    <section className="settings-section">
      <h2><ExternalLink size={20} /> Use Nava in WhatsApp & iMessage</h2>
      <p className="section-desc">
        Connect Nava to messaging apps (WhatsApp, iMessage, Signal, etc.) using OpenClaw. You’ll get a personal connection link and key — no need to know what “APIs” are; just follow the steps below.
      </p>

      <div className="setting-card setting-card-padded">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowHelp(!showHelp)}
          style={{ marginBottom: 12, padding: 0, fontSize: 13, color: 'var(--text-muted)' }}
        >
          <HelpCircle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          {showHelp ? 'Hide' : "What's OpenClaw?"}
        </button>
        {showHelp && (
          <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-muted)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>
              <strong>OpenClaw</strong> is a free app that connects your messaging apps to tools like Nava. You install it once on your computer or server, add Nava with the details below, and then you can message Nava from WhatsApp or iMessage. You don’t need to configure any “APIs” yourself — Nava gives you a ready-to-use connection.
            </p>
          </div>
        )}

        <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Step 1 — Your Nava connection URL</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <code style={{ flex: 1, minWidth: 200, padding: '8px 10px', background: 'var(--bg-muted)', borderRadius: 6, fontSize: 12, wordBreak: 'break-all' }}>
            {NAVA_API_URL}
          </code>
          <button type="button" className="btn btn-ghost btn-sm" onClick={copyUrl}>
            <Copy size={14} /> {apiKeyCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {newApiKey ? (
          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-muted)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              Step 2 — Your secret key (copy now — we won’t show it again)
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              <code style={{ flex: 1, minWidth: 200, padding: '8px 10px', background: 'var(--bg)', borderRadius: 6, fontSize: 12, wordBreak: 'break-all' }}>
                {newApiKey}
              </code>
              <button type="button" className="btn btn-primary btn-sm" onClick={copyKey}>
                <Copy size={14} /> {apiKeyCopied ? 'Copied!' : 'Copy key'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewApiKey(null)}>Done</button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              Or copy everything OpenClaw needs in one go:
            </p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyFullSetup}>
              <Copy size={14} /> Copy full setup for OpenClaw
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, marginBottom: 8 }}>
              Step 2 — Generate your personal key (one click)
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
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
                  showSaved('Key created — copy it now!');
                } catch (err) {
                  setError(err?.message || 'Failed to create key');
                } finally {
                  setApiKeyLoading(false);
                }
              }}
            >
              {apiKeyLoading ? 'Creating…' : 'Generate my Nava key'}
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
        Step-by-step guide: see <code>openclaw-nava/README.md</code> in this repo, or ask your admin if Nava is hosted for you.
      </p>
    </section>
  );
}
