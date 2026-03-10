import { Check, ChevronRight } from 'lucide-react';
import { FOCUS_AREAS } from './quizConfig';
import { QuizTextInput } from '../common/WelcomeGuideQuizInput';

export default function WelcomeStepFocusAreas({ selectedFocusAreas, toggleFocusArea, otherFocusAreaDetail, setOtherFocusAreaDetail, onBack, onNext, canGoNext }) {
  return (
    <>
      <h2 className="guide-title">What do you want to keep on top of?</h2>
      <p className="guide-description">Pick from the menu, or type/speak a whole paragraph — whatever works.</p>
      <div className="quiz-options grid-2">
        {FOCUS_AREAS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`quiz-option ${selectedFocusAreas.includes(s.id) ? 'selected' : ''}`}
            onClick={() => toggleFocusArea(s.id)}
          >
            <span className="quiz-option-icon">{s.icon}</span>
            <span className="quiz-option-text"><strong>{s.label}</strong></span>
            {selectedFocusAreas.includes(s.id) && <Check size={16} className="quiz-check" />}
          </button>
        ))}
      </div>
      <div className="quiz-other-detail">
        <label className="quiz-other-label">Or type your own</label>
        <QuizTextInput
          value={otherFocusAreaDetail}
          onChange={setOtherFocusAreaDetail}
          placeholder="e.g. I struggle with deadlines and only get serious after things go wrong..."
        />
      </div>
      <div className="guide-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={onNext} disabled={!canGoNext}>
          Next <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}
