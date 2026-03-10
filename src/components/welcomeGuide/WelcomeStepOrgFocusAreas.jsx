import { Check, ChevronRight } from 'lucide-react';
import { ORG_FOCUS_AREAS } from './quizConfig';
import { QuizTextInput } from '../common/WelcomeGuideQuizInput';

export default function WelcomeStepOrgFocusAreas({
  orgFocusAreas,
  toggleOrgFocusArea,
  orgOtherFocusAreaDetail,
  setOrgOtherFocusAreaDetail,
  onBack,
  onNext,
  canGoNext,
}) {
  return (
    <>
      <h2 className="guide-title">What does your org need to stay on top of?</h2>
      <p className="guide-description">Pick from the menu, or type/speak a whole paragraph — whatever works.</p>
      <div className="quiz-options grid-2">
        {ORG_FOCUS_AREAS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`quiz-option ${orgFocusAreas.includes(s.id) ? 'selected' : ''}`}
            onClick={() => toggleOrgFocusArea(s.id)}
          >
            <span className="quiz-option-icon">{s.icon}</span>
            <span className="quiz-option-text"><strong>{s.label}</strong></span>
            {orgFocusAreas.includes(s.id) && <Check size={16} className="quiz-check" />}
          </button>
        ))}
      </div>
      <div className="quiz-other-detail">
        <label className="quiz-other-label">Or type your own</label>
        <QuizTextInput
          value={orgOtherFocusAreaDetail}
          onChange={setOrgOtherFocusAreaDetail}
          placeholder="e.g. We struggle with grant deadlines, accreditation renewals, and keeping fleet maintenance on schedule..."
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
