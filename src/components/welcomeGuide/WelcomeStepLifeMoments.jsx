import { Check, ChevronRight } from 'lucide-react';
import { LIFE_MOMENTS } from './quizConfig';
import { QuizTextInput } from '../common/WelcomeGuideQuizInput';

export default function WelcomeStepLifeMoments({
  lifeMoments,
  setLifeMoments,
  otherLifeMomentDetail,
  setOtherLifeMomentDetail,
  onBack,
  onNext,
}) {
  const toggle = (id) => {
    if (id === 'none') {
      setLifeMoments(['none']);
    } else {
      setLifeMoments((prev) =>
        prev.includes('none') ? [id] : prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    }
  };

  return (
    <>
      <h2 className="guide-title">What&apos;s coming up?</h2>
      <p className="guide-description">Pick from the menu, or type/speak a whole paragraph — whatever works.</p>
      <div className="quiz-options">
        {LIFE_MOMENTS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`quiz-option ${lifeMoments.includes(m.id) ? 'selected' : ''}`}
            onClick={() => toggle(m.id)}
          >
            <span className="quiz-option-icon">{m.icon}</span>
            <span className="quiz-option-text">
              <strong>{m.label}</strong>
              <small>{m.desc}</small>
            </span>
            {lifeMoments.includes(m.id) && <Check size={16} className="quiz-check" />}
          </button>
        ))}
      </div>
      <div className="quiz-other-detail">
        <label className="quiz-other-label">Or type your own</label>
        <QuizTextInput
          value={otherLifeMomentDetail}
          onChange={setOtherLifeMomentDetail}
          placeholder="e.g. I'm planning a wedding and also dealing with a lawsuit — it's a lot to keep track of..."
        />
      </div>
      <div className="guide-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Next <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}
