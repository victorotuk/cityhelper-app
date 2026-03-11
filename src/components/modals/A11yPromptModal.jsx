import { X, Volume2 } from 'lucide-react';
import { setVoicePreference } from '../../lib/voice';

const A11Y_ASKED_KEY = (userId) => `nava_a11y_prompt_asked_${userId}`;

export function markA11yPromptAsked(userId) {
  if (userId) localStorage.setItem(A11Y_ASKED_KEY(userId), 'true');
}

export function wasA11yPromptAsked(userId) {
  if (!userId) return true;
  return localStorage.getItem(A11Y_ASKED_KEY(userId)) === 'true';
}

export default function A11yPromptModal({ userId, onClose }) {
  const dismiss = (enableVoice = false) => {
    markA11yPromptAsked(userId);
    if (enableVoice) setVoicePreference(userId, true);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => dismiss(false)}
    >
      <div
        className="modal a11y-prompt-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="a11y-prompt-title"
        aria-describedby="a11y-prompt-desc"
      >
        <div className="modal-header">
          <h2 id="a11y-prompt-title">Use accessibility settings?</h2>
          <button
            type="button"
            className="btn-icon"
            onClick={() => dismiss(false)}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p id="a11y-prompt-desc" className="a11y-prompt-desc">
            You can have the app read out confirmations and important information so you can use Nava without looking at the screen. You can turn this on or off anytime in Settings.
          </p>
          <div className="a11y-prompt-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => dismiss(true)}
            >
              <Volume2 size={18} /> Yes, enable voice
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => dismiss(false)}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
