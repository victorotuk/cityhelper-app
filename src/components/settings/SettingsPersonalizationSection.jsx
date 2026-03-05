import { RefreshCw } from 'lucide-react';

export default function SettingsPersonalizationSection({ persona, setShowQuiz }) {
  return (
    <section className="settings-section">
      <h2><RefreshCw size={20} /> Personalization</h2>
      <p className="section-desc">
        {!persona?.completedOnboarding
          ? "You haven't completed the personalization quiz yet."
          : persona?.accountType === 'organization'
            ? `Organization: ${persona.orgInfo?.name || 'Unnamed'} (${persona.orgInfo?.type || 'other'})`
            : `Personal: ${(persona.roles || []).length} roles, ${(persona.focusAreas ?? persona.struggles ?? []).length} focus areas selected.`}
      </p>
      <div className="setting-card">
        <div className="setting-header">
          <div className={`setting-icon ${persona?.completedOnboarding ? 'active' : 'muted'}`}>
            <RefreshCw size={20} />
          </div>
          <div className="setting-info">
            <h3>{persona?.completedOnboarding ? 'Update Your Profile' : 'Set Up Your Profile'}</h3>
            <p>{persona?.completedOnboarding ? 'Retake the quiz to update your recommendations' : 'Take the quiz so we can personalize your dashboard'}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowQuiz(true)}>
            {persona?.completedOnboarding ? 'Retake Quiz' : 'Take Quiz'}
          </button>
        </div>
      </div>
    </section>
  );
}
