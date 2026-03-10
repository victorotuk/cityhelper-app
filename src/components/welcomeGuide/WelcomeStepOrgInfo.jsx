import { Check, ChevronRight } from 'lucide-react';
import { ORG_TYPES } from './quizConfig';
import { QuizTextInput } from '../common/WelcomeGuideQuizInput';

export default function WelcomeStepOrgInfo({
  orgName,
  setOrgName,
  orgType,
  setOrgType,
  orgTypeOtherDetail,
  setOrgTypeOtherDetail,
  onBack,
  onNext,
  canGoNext,
}) {
  return (
    <>
      <h2 className="guide-title">Tell us about your organization</h2>
      <p className="guide-description">Pick from the menu, or type/speak a whole paragraph — whatever works.</p>
      <div className="org-name-field">
        <label htmlFor="org-name">Organization name</label>
        <input
          id="org-name"
          type="text"
          placeholder="e.g. Maple Street Dental, CityTech Solutions"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          maxLength={100}
          autoFocus
        />
      </div>
      <p className="quiz-sublabel">What type of organization?</p>
      <div className="quiz-options">
        {ORG_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`quiz-option ${orgType === t.id ? 'selected' : ''}`}
            onClick={() => setOrgType(t.id)}
          >
            <span className="quiz-option-icon">{t.icon}</span>
            <span className="quiz-option-text">
              <strong>{t.label}</strong>
              <small>{t.desc}</small>
            </span>
            {orgType === t.id && <Check size={16} className="quiz-check" />}
          </button>
        ))}
      </div>
      <div className="quiz-other-detail">
        <label className="quiz-other-label">Or type your own</label>
        <QuizTextInput
          value={orgTypeOtherDetail}
          onChange={setOrgTypeOtherDetail}
          placeholder="e.g. We're a co-op that runs community programs and needs to track grants and compliance..."
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
