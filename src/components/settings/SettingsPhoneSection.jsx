import { Phone, CheckCircle } from 'lucide-react';

export default function SettingsPhoneSection({
  phoneVerified,
  phoneNumber,
  setPhoneNumber,
  showPhoneInput,
  setShowPhoneInput,
  codeSent,
  setCodeSent,
  verificationCode,
  setVerificationCode,
  phoneLoading,
  formatPhone,
  sendVerificationCode,
  verifyCode,
  removePhone,
}) {
  return (
    <section className="settings-section">
      <h2><Phone size={20} /> Phone Verification <span className="badge-optional">Optional</span></h2>
      <p className="section-desc">Add your phone number for extra account security.</p>
      <div className="setting-card">
        {phoneVerified ? (
          <div className="setting-header">
            <div className="setting-icon active"><CheckCircle size={20} /></div>
            <div className="setting-info"><h3>Phone Verified</h3><p>{phoneNumber}</p></div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={removePhone}>Remove</button>
          </div>
        ) : !showPhoneInput ? (
          <div className="setting-header">
            <div className="setting-icon muted"><Phone size={20} /></div>
            <div className="setting-info"><h3>No phone added</h3><p>Add for extra security</p></div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPhoneInput(true)}>Add Phone</button>
          </div>
        ) : (
          <>
            <div className="setting-header">
              <div className="setting-icon"><Phone size={20} /></div>
              <div className="setting-info">
                <h3>{codeSent ? 'Enter Code' : 'Add Phone'}</h3>
                <p>{codeSent ? 'Check your phone for the code' : 'Canadian or US number'}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowPhoneInput(false); setCodeSent(false); setVerificationCode(''); }}>Cancel</button>
            </div>
            <div className="setting-details">
              {!codeSent ? (
                <div className="phone-input-row">
                  <input type="tel" placeholder="(555) 123-4567" value={phoneNumber} onChange={(e) => setPhoneNumber(formatPhone(e.target.value))} maxLength={14} />
                  <button type="button" className="btn btn-primary btn-sm" onClick={sendVerificationCode} disabled={phoneLoading}>{phoneLoading ? 'Sending...' : 'Send Code'}</button>
                </div>
              ) : (
                <div className="phone-input-row">
                  <input type="text" placeholder="123456" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} style={{ letterSpacing: '0.3em', textAlign: 'center' }} />
                  <button type="button" className="btn btn-primary btn-sm" onClick={verifyCode} disabled={phoneLoading}>{phoneLoading ? 'Verifying...' : 'Verify'}</button>
                </div>
              )}
              {codeSent && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={sendVerificationCode} disabled={phoneLoading} style={{ marginTop: '8px' }}>Resend code</button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
