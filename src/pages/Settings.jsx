import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Settings as SettingsIcon, Bell, BellOff, Shield, Phone, CheckCircle, Trash2, Globe, RefreshCw, MessageSquarePlus, Mail, Smartphone, User, Package, Building2, BookOpen, Download, Key, Copy, ExternalLink } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { APP_CONFIG } from '../lib/config';
import { requestPushPermission, disablePush, preloadPushSDK } from '../lib/push';
import WelcomeGuide from '../components/welcomeGuide/WelcomeGuide';
import SuggestionBox from '../components/modals/SuggestionBox';
import EmailSuggestions from '../components/emailSuggestions/EmailSuggestions';
import SettingsCountrySection from '../components/settings/SettingsCountrySection';
import SettingsAppearanceSection from '../components/settings/SettingsAppearanceSection';
import SettingsAccessibilitySection from '../components/settings/SettingsAccessibilitySection';
import SettingsDataBackupSection from '../components/settings/SettingsDataBackupSection';
import SettingsAISection from '../components/settings/SettingsAISection';
import SettingsOpenClawSection from '../components/settings/SettingsOpenClawSection';
import SettingsRecoverySection from '../components/settings/SettingsRecoverySection';
import SettingsPersonalizationSection from '../components/settings/SettingsPersonalizationSection';
import SettingsWealthSection from '../components/settings/SettingsWealthSection';
import SettingsDangerSection from '../components/settings/SettingsDangerSection';
import SettingsPushSection from '../components/settings/SettingsPushSection';
import SettingsDigestSection from '../components/settings/SettingsDigestSection';
import SettingsPhoneSection from '../components/settings/SettingsPhoneSection';
import SettingsNotificationSuggestionsSection from '../components/settings/SettingsNotificationSuggestionsSection';
import SettingsInAppSection from '../components/settings/SettingsInAppSection';
import SettingsSmartSuggestionsSection from '../components/settings/SettingsSmartSuggestionsSection';
import SettingsSuggestFeatureSection from '../components/settings/SettingsSuggestFeatureSection';
import SettingsPrivacySection from '../components/settings/SettingsPrivacySection';
import SettingsDesktopUpdatesSection from '../components/settings/SettingsDesktopUpdatesSection';
import SettingsAboutSection from '../components/settings/SettingsAboutSection';

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

  // Persona / Quiz
  const [persona, setPersona] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);

  // Weekly digest
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestDay, setDigestDay] = useState(1);

  // Suggestion box
  const [showSuggestionBox, setShowSuggestionBox] = useState(false);

  // Notification suggestions (Android)
  const [notificationSuggestionsEnabled, setNotificationSuggestionsEnabled] = useState(false);

  // Backup
  const [backupLoading, setBackupLoading] = useState(false);

  // AI / BYOK — Groq API key (stored in localStorage, never sent to our servers except when calling AI)
  const GROQ_KEY = `nava_groq_key_${user?.id || ''}`;
  const [groqKey, setGroqKey] = useState('');
  const [groqKeySaved, setGroqKeySaved] = useState(false);

  // OpenClaw / API key
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Show advanced options (API keys, OpenClaw) — default off so non-technical users don't see them
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Recovery passphrase (OAuth users only)
  const isOAuthUser = user && !localStorage.getItem(`keyHash_${user.id}`);
  const [recoveryPassphrase, setRecoveryPassphrase] = useState('');
  const [recoveryConfirm, setRecoveryConfirm] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);


  useEffect(() => {
    if (user) {
      fetchSettings();
      preloadPushSDK();
      const k = localStorage.getItem(`nava_groq_key_${user.id}`);
      setGroqKeySaved(!!k);
      setShowAdvanced(localStorage.getItem(`nava_show_advanced_${user.id}`) === 'true');
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
        .select('phone_number, phone_verified, country, countries, push_enabled, persona, digest_email_enabled, digest_day, notification_suggestions_enabled')
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
        setPersona(data.persona || null);
        setDigestEnabled(!!data.digest_email_enabled);
        setDigestDay(data.digest_day ?? 1);
        setNotificationSuggestionsEnabled(!!data.notification_suggestions_enabled);
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

  if (loading) {
    return (
      <div className="settings-page">
        <PageHeader backTo="/dashboard" title="Settings" icon={<SettingsIcon size={24} />} />
        <main className="settings-main"><div className="loading">Loading settings...</div></main>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <PageHeader backTo="/dashboard" title="Settings" icon={<SettingsIcon size={24} />} />

      <main className="settings-main">
        <div className="settings-container">
          {error && <div className="error-banner">{error}</div>}
          {saved && (
            <div className="success-banner">
              <CheckCircle size={16} />
              {saved}
            </div>
          )}

          <SettingsCountrySection
            userId={user?.id}
            country={country}
            otherCountries={otherCountries}
            setCountry={setCountry}
            setOtherCountries={setOtherCountries}
            saveSettings={saveSettings}
            handleSelectCountry={handleSelectCountry}
            handleToggleOtherCountry={handleToggleOtherCountry}
          />

          <SettingsAppearanceSection />
          <SettingsAccessibilitySection userId={user?.id} />

          <SettingsDataBackupSection
            backupLoading={backupLoading}
            setBackupLoading={setBackupLoading}
            setError={setError}
            showSaved={showSaved}
            userId={user?.id}
          />

          <section className="settings-section">
            <h2>Advanced options</h2>
            <p className="section-desc">
              Show settings for your own AI key, connecting Nava to WhatsApp/iMessage (OpenClaw), and other developer options. Leave off if you just want to use Nava as-is.
            </p>
            <div className="setting-card">
              <div className="setting-header">
                <div className={`setting-icon ${showAdvanced ? 'active' : 'muted'}`}>
                  <Key size={20} />
                </div>
                <div className="setting-info">
                  <h3>{showAdvanced ? 'Advanced options on' : 'Advanced options off'}</h3>
                  <p>{showAdvanced ? 'You see API keys and OpenClaw sections below' : 'Settings stay simple — no API or developer stuff'}</p>
                </div>
                <button
                  type="button"
                  className={`btn btn-sm ${showAdvanced ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => {
                    const next = !showAdvanced;
                    setShowAdvanced(next);
                    if (user?.id) localStorage.setItem(`nava_show_advanced_${user.id}`, next ? 'true' : 'false');
                  }}
                >
                  {showAdvanced ? 'Hide advanced' : 'Show advanced'}
                </button>
              </div>
            </div>
          </section>

          {showAdvanced && (
            <>
              <SettingsAISection
                groqKey={groqKey}
                setGroqKey={setGroqKey}
                groqKeySaved={groqKeySaved}
                setGroqKeySaved={setGroqKeySaved}
                showSaved={showSaved}
                storageKey={GROQ_KEY}
              />
              <SettingsOpenClawSection
                apiKeyLoading={apiKeyLoading}
                setApiKeyLoading={setApiKeyLoading}
                newApiKey={newApiKey}
                setNewApiKey={setNewApiKey}
                apiKeyCopied={apiKeyCopied}
                setApiKeyCopied={setApiKeyCopied}
                setError={setError}
                showSaved={showSaved}
              />
            </>
          )}

          {isOAuthUser && (
            <SettingsRecoverySection
              recoveryPassphrase={recoveryPassphrase}
              setRecoveryPassphrase={setRecoveryPassphrase}
              recoveryConfirm={recoveryConfirm}
              setRecoveryConfirm={setRecoveryConfirm}
              recoveryLoading={recoveryLoading}
              setRecoveryLoading={setRecoveryLoading}
              setError={setError}
              showSaved={showSaved}
              userId={user?.id}
            />
          )}

          <SettingsPersonalizationSection persona={persona} setShowQuiz={setShowQuiz} />

          <SettingsWealthSection />

          <SettingsPushSection
            pushEnabled={pushEnabled}
            pushLoading={pushLoading}
            onEnable={handleEnablePush}
            onDisable={handleDisablePush}
          />

          <SettingsDigestSection
            digestEnabled={digestEnabled}
            digestDay={digestDay}
            setDigestEnabled={setDigestEnabled}
            setDigestDay={setDigestDay}
            saveSettings={saveSettings}
          />

          <EmailSuggestions />

          <SettingsPhoneSection
            phoneVerified={phoneVerified}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            showPhoneInput={showPhoneInput}
            setShowPhoneInput={setShowPhoneInput}
            codeSent={codeSent}
            setCodeSent={setCodeSent}
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            phoneLoading={phoneLoading}
            formatPhone={formatPhone}
            sendVerificationCode={sendVerificationCode}
            verifyCode={verifyCode}
            removePhone={removePhone}
          />

          {Capacitor.getPlatform() === 'android' && (
            <SettingsNotificationSuggestionsSection
              enabled={notificationSuggestionsEnabled}
              setEnabled={setNotificationSuggestionsEnabled}
              saveSettings={saveSettings}
            />
          )}

          <SettingsInAppSection appName={APP_CONFIG.name} />
          <SettingsSmartSuggestionsSection />
          <SettingsSuggestFeatureSection onOpenSuggestionBox={() => setShowSuggestionBox(true)} />
          <SettingsPrivacySection />
          <SettingsDesktopUpdatesSection />
          <SettingsAboutSection />
          <SettingsDangerSection signOut={signOut} />
        </div>
      </main>

      {showSuggestionBox && (
        <SuggestionBox onClose={() => setShowSuggestionBox(false)} />
      )}

      {showQuiz && (
        <WelcomeGuide
          userId={user.id}
          existingPersona={persona}
          isRetake={true}
          onComplete={(newPersona) => {
            setShowQuiz(false);
            if (newPersona) {
              setPersona(newPersona);
              showSaved('Profile updated!');
            }
          }}
        />
      )}
    </div>
  );
}
