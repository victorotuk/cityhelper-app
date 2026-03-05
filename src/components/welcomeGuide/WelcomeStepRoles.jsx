import { Check, ChevronRight } from 'lucide-react';
import { ROLES } from './quizConfig';
import { QuizTextInput } from '../common/WelcomeGuideQuizInput';

export default function WelcomeStepRoles({ selectedRoles, toggleRole, otherRoleDetail, setOtherRoleDetail, onBack, onNext, canGoNext }) {
  return (
    <>
      <h2 className="guide-title">What describes you?</h2>
      <p className="guide-description">Pick from the menu, or type/speak a whole paragraph — whatever works.</p>
      <div className="quiz-options">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`quiz-option ${selectedRoles.includes(r.id) ? 'selected' : ''}`}
            onClick={() => toggleRole(r.id)}
          >
            <span className="quiz-option-icon">{r.icon}</span>
            <span className="quiz-option-text">
              <strong>{r.label}</strong>
              <small>{r.desc}</small>
            </span>
            {selectedRoles.includes(r.id) && <Check size={16} className="quiz-check" />}
          </button>
        ))}
      </div>
      <div className="quiz-other-detail">
        <label className="quiz-other-label">Or type your own</label>
        <QuizTextInput
          value={otherRoleDetail}
          onChange={setOtherRoleDetail}
          placeholder="e.g. I'm a student currently looking for a job, and I struggle with keeping track of everything..."
        />
      </div>
      <div className="guide-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={onNext} disabled={!canGoNext()}>
          Next <ChevronRight size={18} />
        </button>
      </div>
    </>
  );
}
