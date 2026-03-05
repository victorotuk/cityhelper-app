import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function UnlockScreen() {
  const { user, needsRecovery, unlockWithPassword, recoverWithPassphrase } = useAuthStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (needsRecovery) {
        await recoverWithPassphrase(password, user.id);
      } else {
        await unlockWithPassword(password, user.id);
      }
    } catch (err) {
      setError(err.message || (needsRecovery ? 'Incorrect passphrase' : 'Incorrect password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unlock-screen">
      <div className="unlock-content">
        <div className="unlock-icon">
          <Lock size={48} />
        </div>
        <h2>{needsRecovery ? 'Recover your data' : 'Unlock your data'}</h2>
        <p>{needsRecovery ? 'Enter your recovery passphrase to decrypt your data on this device.' : 'Enter your password to decrypt your compliance items and documents.'}</p>
        <form onSubmit={handleSubmit} className="unlock-form">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={needsRecovery ? 'Recovery passphrase' : 'Password'}
            autoFocus
            autoComplete="current-password"
            disabled={loading}
          />
          {error && <p className="unlock-error">{error}</p>}
          <button type="submit" disabled={loading || !password.trim()}>
            {loading ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
