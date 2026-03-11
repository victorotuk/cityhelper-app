import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getVoicePreference, setVoicePreference } from '../../lib/voice';

export default function SettingsAccessibilitySection({ userId }) {
  const [voiceOn, setVoiceOn] = useState(() => getVoicePreference(userId));

  useEffect(() => {
    setVoiceOn(getVoicePreference(userId));
  }, [userId]);

  const handleToggle = () => {
    const next = !voiceOn;
    setVoicePreference(userId, next);
    setVoiceOn(next);
  };

  return (
    <section className="settings-section" aria-labelledby="accessibility-heading">
      <h2 id="accessibility-heading">Accessibility</h2>
      <p className="section-desc">
        Use Nava without looking at the screen. The app can read out confirmations and key information.
      </p>
      <div className="setting-row">
        <div className="setting-icon muted">
          {voiceOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </div>
        <div className="setting-info">
          <h3>Voice feedback</h3>
          <p>Read out scan results, confirmations, and important messages so you can use the app by ear.</p>
        </div>
        <button
          type="button"
          className={`btn btn-sm ${voiceOn ? 'btn-primary' : 'btn-ghost'}`}
          onClick={handleToggle}
          aria-pressed={voiceOn}
          aria-label={voiceOn ? 'Turn off voice feedback' : 'Turn on voice feedback'}
        >
          {voiceOn ? 'On' : 'Off'}
        </button>
      </div>
    </section>
  );
}
