import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Bell, BellOff, Shield, Phone, CheckCircle, Trash2, Globe } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';
import { requestPushPermission, disablePush, preloadPushSDK } from '../lib/push';

export default function Settings() {
  const { user, signOut } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  // Push state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  
  // Country
  const [country, setCountry] = useState('');
  const [otherCountries, setOtherCountries] = useState([]);

  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  const COUNTRIES = [
    { id: 'ca', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
    { id: 'us', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}' }
  ];

  useEffect(() => {
    if (user) {
      fetchSettings();
      preloadPushSDK();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Step 0: Verify we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.error('No active Supabase session!');
        setError('Your session has expired. Please sign out and sign in again.');
        setLoading(false);
        return;
      }
      console.log('[Settings] Session OK, user:', sessionData.session.user.id);

      // Step 1: Try to read existing settings
      const { data, error: fetchErr } = await supabase
        .from('user_settings')
        .select('phone_number, phone_verified, country, countries, push_enabled')
        .eq('user_id', user.id)
        .single();

      if (fetchErr && fetchErr.code === 'PGRST116') {
        // No row exists yet - create one
        console.log('[Settings] No user_settings row found, creating one...');
        const { error: insertErr } = await supabase.from('user_settings').insert({
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        if (insertErr) {
          console.error('[Settings] Failed to create settings row:', insertErr);
          setError('Could not initialize settings: ' + insertErr.message);
        } else {
          console.log('[Settings] Settings row created successfully');
        }
      } else if (fetchErr) {
        console.error('[Settings] Fetch settings error:', fetchErr);
        setError('Could not load settings: ' + fetchErr.message);
      } else if (data) {
        console.log('[Settings] Loaded settings:', data);
        setPhoneNumber(data.phone_number || '');
        setPhoneVerified(data.phone_verified || false);
        setCountry(data.country || '');
        setOtherCountries(Array.isArray(data.countries) ? data.countries : []);
        setPushEnabled(!!data.push_enabled);
      }
    } catch (err) {
      console.error('[Settings] Fetch settings error:', err);
      setError('Error loading settings: ' + (err.message || String(err)));
    }
    setLoading(false);
  };

  // ---- Helper: save to user_settings with error checking ----
  const saveSettings = async (fields) => {
    setError(null);
    console.log('[Settings] Saving:', fields);
    const { data: saveData, error: saveErr } = await supabase.from('user_settings').upsert(
      { user_id: user.id, ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    if (saveErr) {
      console.error('[Settings] Save FAILED:', saveErr);
      setError('Failed to save: ' + saveErr.message);
      return false;
    }
    console.log('[Settings] Save OK:', saveData);
    // Verify it actually saved by reading it back
    const { data: verify } = await supabase
      .from('user_settings')
      .select('country, countries, push_enabled')
      .eq('user_id', user.id)
      .single();
    console.log('[Settings] Verify read-back:', verify);
    showSaved();
    return true;
  };

  // ---- Country ----
  const handleSelectCountry = async (id) => {
    setCountry(id);
    // Also add to otherCountries if not already there (for multi-country)
    await saveSettings({ country: id, countries: otherCountries.length ? otherCountries : null });
  };

  const handleToggleOtherCountry = async (id) => {
    const next = otherCountries.includes(id)
      ? otherCountries.filter(x => x !== id)
      : [...otherCountries, id];
    setOtherCountries(next);
    await saveSettings({ country, countries: next.length ? next : null });
  };

  // ---- Push ----
  const handleEnablePush = async () => {
    setPushLoading(true);
    setError(null);
    try {
      const result = await requestPushPermission(user.id);
      if (result.success) {
        setPushEnabled(true);
        showSaved('Notifications enabled!');
      } else {
        setError(result.detail || 'Could not enable notifications. Try reloading the page.');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setPushLoading(true);
    setError(null);
    try {
      await disablePush(user.id);
      setPushEnabled(false);
      showSaved('Notifications off');
    } catch (err) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setPushLoading(false);
    }
  };

  // ---- Phone ----
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setPhoneLoading(true);
    setError(null);
    try {
      const { error: fnErr } = await supabase.functions.invoke('send-sms', {
        body: { phone: phoneNumber, userId: user.id }
      });
      if (fnErr) throw fnErr;
      setCodeSent(true);
      showSaved('Code sent!');
    } catch (err) {
      setError(err.message || 'Failed to send code');
    }
    setPhoneLoading(false);
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setPhoneLoading(true);
    setError(null);
    try {
      const { error: fnErr } = await supabase.functions.invoke('verify-phone', {
        body: { code: verificationCode, userId: user.id }
      });
      if (fnErr) throw fnErr;
      setPhoneVerified(true);
      setCodeSent(false);
      setShowPhoneInput(false);
      setVerificationCode('');
      showSaved('Phone verified!');
    } catch (err) {
      setError(err.message || 'Invalid code');
    }
    setPhoneLoading(false);
  };

  const removePhone = async () => {
    if (!confirm('Remove your verified phone number?')) return;
    try {
      const { error: rmErr } = await supabase.from('user_settings').update({
        phone_number: null,
        phone_verified: false
      }).eq('user_id', user.id);
      if (rmErr) throw rmErr;
      setPhoneNumber('');
      setPhoneVerified(false);
      showSaved('Phone removed');
    } catch (err) {
      setError(err.message);
    }
  };

  // ---- UI helpers ----
  const showSaved = (msg = 'Saved') => {
    setSaved(msg);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    if (!confirm('This action CANNOT be undone. Are you absolutely sure?')) return;
    alert('Account deletion would be processed. For now, signing out.');
    signOut();
  };

  if (loading) {
    return (
      <div className="settings-page">
        <header className="page-header">
          <Link to="/dashboard" className="back-btn"><ArrowLeft size={20} /> Back</Link>
          <div className="header-title"><SettingsIcon size={24} /><span>Settings</span></div>
          <div style={{ width: 80 }} />
        </header>
        <main className="settings-main"><div className="loading">Loading settings...</div></main>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="page-header">
        <Link to="/dashboard" className="back-btn"><ArrowLeft size={20} /> Back</Link>
        <div className="header-title"><SettingsIcon size={24} /><span>Settings</span></div>
        <div style={{ width: 80 }} />
      </header>

      <main className="settings-main">
        <div className="settings-container">
          {error && <div className="error-banner">{error}</div>}
          {saved && (
            <div className="success-banner">
              <CheckCircle size={16} />
              {saved}
            </div>
          )}

          {/* Country */}
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
                          // Deselect primary
                          setCountry('');
                          saveSettings({ country: null, countries: otherCountries.length ? otherCountries : null });
                        } else if (isOther) {
                          // Remove from other
                          const next = otherCountries.filter(x => x !== c.id);
                          setOtherCountries(next);
                          saveSettings({ country, countries: next.length ? next : null });
                        } else if (!country) {
                          // No primary yet, set this as primary
                          handleSelectCountry(c.id);
                        } else {
                          // Already have primary, add as other
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

          {/* Push Notifications */}
          <section className="settings-section">
            <h2><Bell size={20} /> Push Notifications</h2>
            <p className="section-desc">Get reminded about upcoming deadlines on your device.</p>
            <div className="setting-card">
              <div className="setting-header">
                <div className={`setting-icon ${pushEnabled ? 'active' : 'muted'}`}>
                  {pushEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </div>
                <div className="setting-info">
                  <h3>{pushEnabled ? 'Notifications On' : 'Notifications Off'}</h3>
                  <p>{pushEnabled ? "You'll get reminders before deadlines expire" : "Turn on to get deadline reminders"}</p>
                </div>
                {pushEnabled ? (
                  <button className="btn btn-ghost btn-sm" onClick={handleDisablePush} disabled={pushLoading}>
                    {pushLoading ? 'Turning off...' : 'Turn Off'}
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={handleEnablePush} disabled={pushLoading}>
                    {pushLoading ? 'Enabling...' : 'Turn On'}
                  </button>
                )}
              </div>
              {!pushEnabled && !pushLoading && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 16px 12px', margin: 0 }}>
                  Your browser will ask for permission. If you previously blocked notifications,
                  go to your browser settings &gt; Site Settings &gt; Notifications and allow this site.
                </p>
              )}
            </div>
          </section>

          {/* Phone Verification */}
          <section className="settings-section">
            <h2><Phone size={20} /> Phone Verification <span className="badge-optional">Optional</span></h2>
            <p className="section-desc">Add your phone number for extra account security.</p>
            <div className="setting-card">
              {phoneVerified ? (
                <div className="setting-header">
                  <div className="setting-icon active"><CheckCircle size={20} /></div>
                  <div className="setting-info"><h3>Phone Verified</h3><p>{phoneNumber}</p></div>
                  <button className="btn btn-ghost btn-sm" onClick={removePhone}>Remove</button>
                </div>
              ) : !showPhoneInput ? (
                <div className="setting-header">
                  <div className="setting-icon muted"><Phone size={20} /></div>
                  <div className="setting-info"><h3>No phone added</h3><p>Add for extra security</p></div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowPhoneInput(true)}>Add Phone</button>
                </div>
              ) : (
                <>
                  <div className="setting-header">
                    <div className="setting-icon"><Phone size={20} /></div>
                    <div className="setting-info">
                      <h3>{codeSent ? 'Enter Code' : 'Add Phone'}</h3>
                      <p>{codeSent ? 'Check your phone for the code' : 'Canadian or US number'}</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowPhoneInput(false); setCodeSent(false); setVerificationCode(''); }}>Cancel</button>
                  </div>
                  <div className="setting-details">
                    {!codeSent ? (
                      <div className="phone-input-row">
                        <input type="tel" placeholder="(555) 123-4567" value={phoneNumber} onChange={(e) => setPhoneNumber(formatPhone(e.target.value))} maxLength={14} />
                        <button className="btn btn-primary btn-sm" onClick={sendVerificationCode} disabled={phoneLoading}>{phoneLoading ? 'Sending...' : 'Send Code'}</button>
                      </div>
                    ) : (
                      <div className="phone-input-row">
                        <input type="text" placeholder="123456" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} style={{ letterSpacing: '0.3em', textAlign: 'center' }} />
                        <button className="btn btn-primary btn-sm" onClick={verifyCode} disabled={phoneLoading}>{phoneLoading ? 'Verifying...' : 'Verify'}</button>
                      </div>
                    )}
                    {codeSent && (
                      <button className="btn btn-ghost btn-sm" onClick={sendVerificationCode} disabled={phoneLoading} style={{ marginTop: '8px' }}>Resend code</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* In-App Notifications */}
          <section className="settings-section">
            <h2>In-App Notifications</h2>
            <p className="section-desc">These appear in the notification bell when you open {APP_CONFIG.name}.</p>
            <div className="info-card">
              <p>&#10003; Deadline reminders (30, 14, 7 days before)</p>
              <p>&#10003; Document scan results</p>
              <p>&#10003; Account security alerts</p>
            </div>
          </section>

          {/* Privacy */}
          <section className="settings-section privacy">
            <h2><Shield size={20} /> Your Privacy</h2>
            <ul>
              <li>All your data is encrypted with your password</li>
              <li>We cannot read your documents or compliance details</li>
              <li>Phone number is only used for verification</li>
              <li>No spam, ever</li>
            </ul>
          </section>

          {/* Danger Zone */}
          <section className="settings-section danger">
            <h2>Danger Zone</h2>
            <div className="setting-card danger">
              <div className="setting-header">
                <div className="setting-icon danger"><Trash2 size={20} /></div>
                <div className="setting-info"><h3>Delete Account</h3><p>Permanently delete your account and all data</p></div>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>Delete</button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
