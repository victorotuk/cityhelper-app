import { Shield } from 'lucide-react';

export default function SettingsPrivacySection() {
  return (
    <section className="settings-section privacy">
      <h2><Shield size={20} /> Your Privacy</h2>
      <ul>
        <li>All your data is encrypted with your password</li>
        <li>We cannot read your documents or compliance details</li>
        <li>Phone number is only used for verification</li>
        <li>No spam, ever</li>
      </ul>
    </section>
  );
}
