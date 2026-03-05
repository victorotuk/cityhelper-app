export default function SettingsSmartSuggestionsSection() {
  return (
    <section className="settings-section">
      <h2>Smart Suggestions</h2>
      <p className="section-desc">We help you remember what to track — without ever seeing your data.</p>
      <div className="privacy-note">
        <strong>Your data stays on your device.</strong> When you paste text, share from another app, or (optionally) use notification suggestions, we process everything locally. We only save what you explicitly choose to add. Nothing is sent to our servers.
      </div>
      <ul className="smart-suggest-list">
        <li><strong>Paste & suggest</strong> — Paste from clipboard in Add Item to auto-detect dates and events</li>
        <li><strong>Share to Nava</strong> — Share text from Messages, Email, etc. (Android) to suggest tracking</li>
        <li><strong>Notification suggestions</strong> — (Android, coming soon) Optionally suggest tracking when parking tickets, renewal reminders, etc. appear in notifications</li>
      </ul>
    </section>
  );
}
