import { useState, useEffect } from 'react';
import { Mail, Link2, Unlink, RefreshCw, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useComplianceStore } from '../stores/complianceStore';
import { APP_CONFIG } from '../lib/config';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://qyisjxfugogimgzhualw.supabase.co').replace(/\/$/, '');
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

const PROVIDERS = [
  { id: 'gmail', name: 'Gmail', desc: 'Google Mail' },
  { id: 'outlook', name: 'Outlook', desc: 'Microsoft 365, Outlook.com, Hotmail' },
];

export default function EmailSuggestions({ onAddItem }) {
  const { user } = useAuthStore();
  const { addItem, fetchItems } = useComplianceStore();
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  const connected = Object.keys(connections).length > 0;

  const checkConnection = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${FUNCTIONS_URL}/email-oauth`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      setConnections(data.connections || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('email_connected') === 'true') {
      checkConnection();
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('error')) {
      setError(params.get('error'));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async (provider) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${FUNCTIONS_URL}/email-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (provider) => {
    const name = PROVIDERS.find(p => p.id === provider)?.name || provider;
    if (!confirm(`Disconnect ${name}? We'll stop suggesting items from that inbox.`)) return;
    await supabase.from('email_connections').delete().eq('user_id', user.id).eq('provider', provider);
    setConnections(prev => {
      const next = { ...prev };
      delete next[provider];
      return next;
    });
    setSuggestions([]);
  };

  const handleFetchSuggestions = async () => {
    setFetching(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${FUNCTIONS_URL}/fetch-email-suggestions`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestions(data.suggestions || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch');
    } finally {
      setFetching(false);
    }
  };

  const handleAdd = async (s) => {
    try {
      await addItem({
        name: s.name,
        category: s.category,
        due_date: s.due_date || null,
        notes: [s.amount, s.notes].filter(Boolean).join(' · ') || null,
        user_id: user.id,
        created_at: new Date().toISOString(),
      });
      await supabase.from('email_suggestion_dismissed').upsert(
        { user_id: user.id, email_message_id: s.email_message_id },
        { onConflict: 'user_id,email_message_id', ignoreDuplicates: true }
      );
      setSuggestions(prev => prev.filter(x => x.email_message_id !== s.email_message_id));
      fetchItems(user.id);
      onAddItem?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDismiss = async (s) => {
    await supabase.from('email_suggestion_dismissed').upsert(
      { user_id: user.id, email_message_id: s.email_message_id },
      { onConflict: 'user_id,email_message_id', ignoreDuplicates: true }
    );
    setSuggestions(prev => prev.filter(x => x.email_message_id !== s.email_message_id));
  };

  const getCategoryName = (id) => APP_CONFIG.categories.find(c => c.id === id)?.name || id;

  return (
    <section className="settings-section">
      <h2><Mail size={20} /> Email suggestions</h2>
      <p className="section-desc">
        Connect your email (Gmail, Outlook, etc.) to find subscriptions, tickets, renewals, and bills in your inbox. We suggest items — you choose what to add.
      </p>
      {error && <p className="suggestion-error">{error}</p>}
      <div className="setting-card">
        {!connected ? (
          <div className="email-providers-connect">
            <div className="setting-header">
              <div className="setting-icon muted"><Mail size={20} /></div>
              <div className="setting-info">
                <h3>No email connected</h3>
                <p>Connect Gmail or Outlook to scan for trackable items</p>
              </div>
            </div>
            <div className="email-provider-buttons">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  className="btn btn-primary btn-sm"
                  onClick={() => handleConnect(p.id)}
                  disabled={loading}
                >
                  {loading ? 'Connecting...' : <><Link2 size={16} /> Connect {p.name}</>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="setting-header">
              <div className="setting-icon active"><Mail size={20} /></div>
              <div className="setting-info">
                <h3>Email connected</h3>
                <p>Scan inbox for subscriptions, tickets, renewals</p>
              </div>
            </div>
            <div className="email-connections-list">
              {PROVIDERS.map(p => (
                <div key={p.id} className="email-connection-row">
                  <div className="email-connection-info">
                    <strong>{connections[p.id] ? `✓ ${p.name}` : p.name}</strong>
                    <span className="email-connection-meta">
                      {connections[p.id] ? (connections[p.id].email || 'Connected') : 'Not connected'}
                    </span>
                  </div>
                  {connections[p.id] ? (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDisconnect(p.id)}>
                      <Unlink size={14} /> Disconnect
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleConnect(p.id)}
                      disabled={loading}
                    >
                      {loading ? '...' : <><Link2 size={14} /> Connect</>}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="setting-details" style={{ padding: '12px 16px' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleFetchSuggestions}
                disabled={fetching}
              >
                {fetching ? 'Scanning...' : <><RefreshCw size={16} /> Scan inbox</>}
              </button>
            </div>
          </>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="setting-card" style={{ marginTop: 'var(--space-md)' }}>
          <h4 style={{ marginBottom: 'var(--space-sm)' }}>Suggested from inbox</h4>
          <div className="email-suggestions-list">
            {suggestions.map((s, i) => (
              <div key={`${s.email_message_id}-${s.name}-${i}`} className="email-suggestion-row">
                <div className="email-suggestion-info">
                  <strong>{s.name}</strong>
                  <span className="email-suggestion-meta">
                    {getCategoryName(s.category)}
                    {s.due_date && ` · Due ${s.due_date}`}
                    {s.amount && ` · ${s.amount}`}
                  </span>
                </div>
                <div className="email-suggestion-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleAdd(s)}>
                    <Plus size={14} /> Add
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDismiss(s)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
