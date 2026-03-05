import { Shield } from 'lucide-react';

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
  return (
    <section className="settings-section">
      <h2><Shield size={20} /> Recovery passphrase</h2>
      <p className="section-desc">
        Set a passphrase to recover your data on a new device. If you lose access, enter this passphrase to unlock your items.
      </p>
      <div className="setting-card setting-card-padded">
        <input
          type="password"
          placeholder="New recovery passphrase"
          value={recoveryPassphrase}
          onChange={(e) => setRecoveryPassphrase(e.target.value)}
          className="setting-input"
        />
        <input
          type="password"
          placeholder="Confirm passphrase"
          value={recoveryConfirm}
          onChange={(e) => setRecoveryConfirm(e.target.value)}
          className="setting-input"
          style={{ marginTop: '8px' }}
        />
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ marginTop: '8px' }}
          disabled={recoveryLoading || !recoveryPassphrase || recoveryPassphrase !== recoveryConfirm}
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
    </section>
  );
}
