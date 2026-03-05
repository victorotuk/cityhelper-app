import { ChevronRight } from 'lucide-react';
import { APP_CONFIG } from '../../lib/config';

export default function WelcomeStepWelcome({ onSkip, onNext }) {
  return (
    <>
      <div className="guide-icon"><span className="guide-emoji">🍁</span></div>
      <h2 className="guide-title">Welcome to {APP_CONFIG.name}</h2>
      <p className="guide-description">
        A few quick questions so we can show you exactly what matters. You can pick from our menu, type, or speak — whatever works.
      </p>
      <div className="guide-actions">
        <button type="button" className="btn btn-ghost" onClick={onSkip}>Skip</button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Let&apos;s go <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}
