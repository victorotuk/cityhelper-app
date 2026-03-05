import { Check } from 'lucide-react';
import { QuizTextareaMic } from '../common/WelcomeGuideQuizInput';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function WelcomeStepOtherNeeds({
  accountType,
  orgName,
  otherNeeds,
  setOtherNeeds,
  orgOtherNeeds,
  setOrgOtherNeeds,
  onBack,
  onFinish,
  saving,
}) {
  const value = accountType === 'personal' ? otherNeeds : orgOtherNeeds;
  const setValue = accountType === 'personal' ? setOtherNeeds : setOrgOtherNeeds;

  return (
    <>
      <h2 className="guide-title">Anything else?</h2>
      <p className="guide-description">
        {accountType === 'personal'
          ? "Type or speak a whole paragraph — we'll use it to personalize. Optional."
          : `Type or speak a whole paragraph — we'll tailor for ${orgName || 'your org'}. Optional.`}
      </p>
      <div className="org-name-field">
        <div className="quiz-text-with-mic quiz-textarea-wrap">
          <textarea
            placeholder={accountType === 'personal'
              ? "e.g. I'm a student looking for work, I struggle with deadlines, and I only get serious when things go wrong..."
              : "e.g. We're a small clinic struggling with accreditation deadlines, grant reporting, and staff certifications..."}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            maxLength={500}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
          {SpeechRecognition && (
            <QuizTextareaMic value={value} onChange={setValue} />
          )}
        </div>
        <small className="field-hint">We&apos;ll use this to personalize your experience. You can skip.</small>
      </div>
      <div className="guide-actions">
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back</button>
        <button type="button" className="btn btn-primary" onClick={onFinish} disabled={saving}>
          {saving ? 'Saving...' : <><Check size={18} /> Done</>}
        </button>
      </div>
    </>
  );
}
