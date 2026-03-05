import { Trash2 } from 'lucide-react';

export default function SettingsDangerSection({ signOut }) {
  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and all data.')) return;
    if (!confirm('This action CANNOT be undone. Are you absolutely sure?')) return;
    alert('Account deletion would be processed. For now, signing out.');
    signOut();
  };

  return (
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
  );
}
