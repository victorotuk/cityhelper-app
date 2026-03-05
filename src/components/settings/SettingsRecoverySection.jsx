import { Shield, KeyRound } from 'lucide-react';

export default function SettingsRecoverySection({
  recoveryPassphrase,
  setRecoveryPassphrase,
  recoveryConfirm,
  setRecoveryConfirm,
  recoveryLoading,
  setRecoveryLoading,
  setError,
  showSaved,
  userId
}) {
  const canSubmit = Boolean(
    recoveryPassphrase &&
    recoveryConfirm &&
    recoveryPassphrase === recoveryConfirm &&
    recoveryPassphrase.length >= 8
  );

  return (
    <section className="settings-section">
      <h2><Shield size={20} /> Recovery passphrase</h2>
      <p className="section-desc">
        Set a passphrase to recover your data on a new device. If you lose access, enter this passphrase to unlock your items.
      </p>
      <div className="setting-card setting-card-padded settings-recovery-card">
        <div className="settings-recovery-header">
          <div className="setting-icon muted">
            <KeyRound size={22} />
          </div>
          <div className="settings-recovery-info">
            <h3>Set recovery passphrase</h3>
            <p>Use at least 8 characters. Store it somewhere safe — you’ll need it to unlock data on a new device.</p>
          </div>
        </div>
        <div className="settings-recovery-form">
          <label className="settings-recovery-label">New passphrase</label>
          <input
            type="password"
            placeholder="Enter passphrase"
            value={recoveryPassphrase}
            onChange={(e) => setRecoveryPassphrase(e.target.value)}
            className="setting-input settings-recovery-input"
            autoComplete="new-password"
          />
          <label className="settings-recovery-label">Confirm passphrase</label>
          <input
            type="password"
            placeholder="Enter again"
            value={recoveryConfirm}
            onChange={(e) => setRecoveryConfirm(e.target.value)}
            className="setting-input settings-recovery-input"
            autoComplete="new-password"
          />
          {recoveryPassphrase && recoveryConfirm && recoveryPassphrase !== recoveryConfirm && (
            <p className="settings-recovery-hint error">Passphrases don’t match</p>
          )}
          {recoveryPassphrase && recoveryPassphrase.length > 0 && recoveryPassphrase.length < 8 && (
            <p className="settings-recovery-hint warning">Use at least 8 characters</p>
          )}
          <button
            type="button"
            className="btn btn-primary settings-recovery-submit"
            disabled={recoveryLoading || !canSubmit}
            onClick={async () => {
              setRecoveryLoading(true);
              try {
                const { useAuthStore } = await import('../../stores/authStore');
                await useAuthStore.getState().setRecoveryPassphrase(recoveryPassphrase, userId);
                setRecoveryPassphrase('');
                setRecoveryConfirm('');
                showSaved('Recovery passphrase set');
              } catch (err) {
                setError(err?.message || 'Failed');
              } finally {
                setRecoveryLoading(false);
              }
            }}
          >
            {recoveryLoading ? 'Setting…' : 'Set recovery passphrase'}
          </button>
        </div>
      </div>
    </section>
  );
}
