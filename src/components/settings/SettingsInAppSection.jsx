export default function SettingsInAppSection({ appName }) {
  return (
    <section className="settings-section">
      <h2>In-App Notifications</h2>
      <p className="section-desc">These appear in the notification bell when you open {appName}.</p>
      <div className="info-card">
        <p>&#10003; Deadline reminders (30, 14, 7 days before)</p>
        <p>&#10003; Document scan results</p>
        <p>&#10003; Account security alerts</p>
      </div>
    </section>
  );
}
