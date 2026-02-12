import { useState, useEffect } from 'react';
import { X, ChevronRight, Bell, FileText, Calendar, Bot, Check } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';

const STEPS = [
  {
    id: 'welcome',
    icon: '🍁',
    title: `Welcome to ${APP_CONFIG.name}`,
    description: 'Never miss a deadline again. Let me show you around.',
  },
  {
    id: 'deadlines',
    icon: <Calendar size={24} />,
    title: 'Track Your Deadlines',
    description: 'Add taxes, visas, licenses, and renewals. We\'ll remind you before they expire.',
  },
  {
    id: 'documents',
    icon: <FileText size={24} />,
    title: 'Store Documents Securely',
    description: 'Upload IDs, tax forms, and receipts. Everything is encrypted.',
  },
  {
    id: 'assistant',
    icon: <Bot size={24} />,
    title: 'AI Compliance Assistant',
    description: 'Ask questions about Canadian taxes, visas, and regulations.',
  },
  {
    id: 'notifications',
    icon: <Bell size={24} />,
    title: 'Stay Notified',
    description: 'Enable push notifications in Settings to get deadline reminders on your home screen.',
    isLast: true,
  },
];

export default function WelcomeGuide({ userId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const step = STEPS[currentStep];
  const isLastStep = step.isLast === true;

  useEffect(() => {
    // Check if user has seen the guide
    const hasSeenGuide = localStorage.getItem(`welcomeGuide_${userId}`);
    if (hasSeenGuide) setVisible(false); // eslint-disable-line react-hooks/set-state-in-effect -- read from localStorage on mount
  }, [userId]);

  const handleNext = async () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(`welcomeGuide_${userId}`, 'true');
    setVisible(false);
    onComplete?.();
  };

  if (!visible) return null;

  return (
    <div className="welcome-guide-overlay">
      <div className="welcome-guide">
        <button className="guide-close" onClick={handleSkip} aria-label="Skip">
          <X size={20} />
        </button>

        {/* Progress dots */}
        <div className="guide-progress">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`progress-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="guide-icon">
          {typeof step.icon === 'string' ? (
            <span className="guide-emoji">{step.icon}</span>
          ) : (
            step.icon
          )}
        </div>

        {/* Content */}
        <h2 className="guide-title">{step.title}</h2>
        <p className="guide-description">{step.description}</p>

        {/* Actions */}
        <div className="guide-actions">
          {!isLastStep && (
            <button className="btn btn-ghost" onClick={handleSkip}>
              Skip tour
            </button>
          )}
          <button className="btn btn-primary" onClick={handleNext}>
            {isLastStep ? (
              <>
                <Check size={18} />
                Done
              </>
            ) : (
              <>
                Next
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
