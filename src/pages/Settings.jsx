import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, Bell, BellOff, Shield, Phone, CheckCircle, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';
import { requestPushPermission, disablePush, isPushEnabled as checkPushEnabled } from '../lib/push';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  // Push state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  
  // Phone verification state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
      checkPushStatus();
    }
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('phone_number, phone_verified')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPhoneNumber(data.phone_number || '');
        setPhoneVerified(data.phone_verified || false);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
    setLoading(false);
  };

  const checkPushStatus = async () => {
    const enabled = await checkPushEnabled();
    setPushEnabled(enabled);
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    setError(null);
    try {
      const success = await requestPushPermission(user.id);
      if (success) {
        setPushEnabled(true);
        showSaved();
      } else {
        setError('Push notifications were blocked. Check your browser/device settings.');
      }
    } catch (err) {
      setError(err.message);
    }
    setPushLoading(false);
  };

  const handleDisablePush = async () => {
    setPushLoading(true);
    try {
      await disablePush(user.id);
      setPushEnabled(false);
      showSaved();
    } catch (err) {
      setError(err.message);
    }
    setPushLoading(false);
  };

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
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { phone: phoneNumber, userId: user.id }
      });

      if (error) throw error;
      
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
      const { data, error } = await supabase.functions.invoke('verify-phone', {
        body: { code: verificationCode, userId: user.id }
      });

      if (error) throw error;

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
      await supabase.from('user_settings').update({
        phone_number: null,
        phone_verified: false
      }).eq('user_id', user.id);

      setPhoneNumber('');
      setPhoneVerified(false);
      showSaved('Phone removed');
    } catch (err) {
      setError(err.message);
    }
  };

  const showSaved = (msg = 'Saved') => {
    setSaved(msg);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    if (!confirm('This action CANNOT be undone. Are you absolutely sure?')) return;
    
    alert('Account deletion would be processed. For now, signing out.');
    logout();
  };

  if (loading) {
    return (
      <div className="settings-page">
        <header className="page-header">
          <Link to="/dashboard" className="back-btn">
            <ArrowLeft size={20} />
            Back
          </Link>
          <div className="header-title">
            <SettingsIcon size={24} />
            <span>Settings</span>
          </div>
          <div style={{ width: 80 }} />
        </header>
        <main className="settings-main">
          <div className="loading">Loading settings...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <header className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="header-title">
          <SettingsIcon size={24} />
          <span>Settings</span>
        </div>
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

          {/* Push Notifications */}
          <section className="settings-section">
            <h2>
              <Bell size={20} />
              Push Notifications
            </h2>
            <p className="section-desc">
              Notifications are enabled by default so you never miss a deadline.
            </p>

            <div className="setting-card">
              <div className="setting-header">
                <div className={`setting-icon ${pushEnabled ? 'active' : 'muted'}`}>
                  {pushEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </div>
                <div className="setting-info">
                  <h3>{pushEnabled ? 'Notifications On' : 'Notifications Off'}</h3>
                  <p>
                    {pushEnabled 
                      ? "We'll remind you about upcoming deadlines"
                      : "You won't receive push notifications"
                    }
                  </p>
                </div>
                {pushEnabled ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleDisablePush}
                    disabled={pushLoading}
                  >
                    {pushLoading ? '...' : 'Turn Off'}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                  >
                    {pushLoading ? '...' : 'Turn On'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Phone Verification (Optional) */}
          <section className="settings-section">
            <h2>
              <Phone size={20} />
              Phone Verification
              <span className="badge-optional">Optional</span>
            </h2>
            <p className="section-desc">
              Add your phone number for extra account security.
            </p>

            <div className="setting-card">
              {phoneVerified ? (
                // Phone is verified
                <div className="setting-header">
                  <div className="setting-icon active">
                    <CheckCircle size={20} />
                  </div>
                  <div className="setting-info">
                    <h3>Phone Verified</h3>
                    <p>{phoneNumber}</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={removePhone}>
                    Remove
                  </button>
                </div>
              ) : !showPhoneInput ? (
                // Show add phone button
                <div className="setting-header">
                  <div className="setting-icon muted">
                    <Phone size={20} />
                  </div>
                  <div className="setting-info">
                    <h3>No phone added</h3>
                    <p>Add for extra security</p>
                  </div>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowPhoneInput(true)}
                  >
                    Add Phone
                  </button>
                </div>
              ) : (
                // Phone input flow
                <>
                  <div className="setting-header">
                    <div className="setting-icon">
                      <Phone size={20} />
                    </div>
                    <div className="setting-info">
                      <h3>{codeSent ? 'Enter Code' : 'Add Phone'}</h3>
                      <p>{codeSent ? 'Check your phone for the code' : 'Canadian number'}</p>
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setShowPhoneInput(false);
                        setCodeSent(false);
                        setVerificationCode('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="setting-details">
                    {!codeSent ? (
                      <div className="phone-input-row">
                        <input
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                          maxLength={14}
                        />
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={sendVerificationCode}
                          disabled={phoneLoading}
                        >
                          {phoneLoading ? 'Sending...' : 'Send Code'}
                        </button>
                      </div>
                    ) : (
                      <div className="phone-input-row">
                        <input
                          type="text"
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          style={{ letterSpacing: '0.3em', textAlign: 'center' }}
                        />
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={verifyCode}
                          disabled={phoneLoading}
                        >
                          {phoneLoading ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    )}
                    {codeSent && (
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={sendVerificationCode}
                        disabled={phoneLoading}
                        style={{ marginTop: '8px' }}
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* In-App Notifications */}
          <section className="settings-section">
            <h2>📱 In-App Notifications</h2>
            <p className="section-desc">
              These appear in the notification bell when you open {APP_CONFIG.name}.
            </p>
            <div className="info-card">
              <p>✓ Deadline reminders (30, 14, 7 days before)</p>
              <p>✓ Document scan results</p>
              <p>✓ Account security alerts</p>
            </div>
          </section>

          {/* Privacy Notice */}
          <section className="settings-section privacy">
            <h2>
              <Shield size={20} />
              Your Privacy
            </h2>
            <ul>
              <li>All your data is encrypted with your password</li>
              <li>We can't read your documents or compliance details</li>
              <li>Phone number is only used for verification</li>
              <li>No spam, ever</li>
            </ul>
          </section>

          {/* Danger Zone */}
          <section className="settings-section danger">
            <h2>⚠️ Danger Zone</h2>
            <div className="setting-card danger">
              <div className="setting-header">
                <div className="setting-icon danger">
                  <Trash2 size={20} />
                </div>
                <div className="setting-info">
                  <h3>Delete Account</h3>
                  <p>Permanently delete your account and all data</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={handleDeleteAccount}>
                  Delete
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
