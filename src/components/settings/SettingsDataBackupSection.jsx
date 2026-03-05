import { Shield, Download } from 'lucide-react';

export default function SettingsDataBackupSection({ backupLoading, setBackupLoading, setError, showSaved, userId }) {
  return (
    <section className="settings-section">
      <h2><Shield size={20} /> Data & Backup</h2>
      <p className="section-desc">
        Export a backup of your compliance items (encrypted). Store it safely — you can restore it later if needed.
      </p>
      <div className="setting-card">
        <button
          type="button"
          className="btn-secondary"
          disabled={backupLoading}
          onClick={async () => {
            setBackupLoading(true);
            try {
              const { exportBackup } = await import('../../lib/localStorage');
              const backup = await exportBackup(userId);
              const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nava-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              showSaved('Backup downloaded');
            } catch (err) {
              setError(err?.message || 'Backup failed');
            } finally {
              setBackupLoading(false);
            }
          }}
        >
          <Download size={18} />
          {backupLoading ? 'Exporting…' : 'Export backup'}
        </button>
      </div>
    </section>
  );
}
