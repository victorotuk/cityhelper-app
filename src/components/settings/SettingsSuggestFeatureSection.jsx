import { MessageSquarePlus } from 'lucide-react';

export default function SettingsSuggestFeatureSection({ onOpenSuggestionBox }) {
  return (
    <section className="settings-section">
      <h2><MessageSquarePlus size={20} /> Suggest a Feature</h2>
      <p className="section-desc">Have an idea for something new to track? We read every suggestion.</p>
      <div className="setting-card">
        <div className="setting-header">
          <div className="setting-icon muted"><MessageSquarePlus size={20} /></div>
          <div className="setting-info">
            <h3>Suggest something to track</h3>
            <p>New categories, templates, or reminders — tell us what you need</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenSuggestionBox}>
            Open Suggestion Box
          </button>
        </div>
      </div>
    </section>
  );
}
