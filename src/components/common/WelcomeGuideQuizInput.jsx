/**
 * Quiz text inputs with optional speech-to-text for WelcomeGuide onboarding.
 */
import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export function QuizTextInput({ value, onChange, placeholder, maxLength = 1000, rows = 4, className = 'quiz-other-input' }) {
  const [listening, setListening] = useState(false);
  const [speechPreview, setSpeechPreview] = useState(null);
  const recognitionRef = useRef(null);

  const toggleSpeech = useCallback((replaceAll = false) => {
    if (!SpeechRecognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (replaceAll) {
      onChange('');
      setSpeechPreview(null);
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      if (transcript) {
        onChange((replaceAll ? '' : value ? value + ' ' : '') + transcript);
        setSpeechPreview(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, value, onChange]);

  return (
    <div className="quiz-text-with-mic-wrap">
      <div className="quiz-text-with-mic">
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (speechPreview) setSpeechPreview(null);
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className={className}
          style={{ resize: 'vertical', minHeight: 80 }}
        />
        {SpeechRecognition && (
          <button
            type="button"
            className={`quiz-mic-btn ${listening ? 'listening' : ''}`}
            onClick={() => toggleSpeech(false)}
            title={listening ? 'Tap to stop' : 'Speak a paragraph'}
            aria-label={listening ? 'Tap to stop listening' : 'Speak a paragraph'}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}
      </div>
      {listening && <small className="quiz-speak-hint">Speak your whole paragraph, then tap the mic to stop.</small>}
      {speechPreview && (
        <div className="speech-review-bar speech-review-bar-quiz">
          <span className="speech-review-text">We heard: &quot;{speechPreview.length > 40 ? speechPreview.slice(0, 40) + '…' : speechPreview}&quot;</span>
          <button type="button" className="speech-review-again" onClick={() => toggleSpeech(true)}>
            <Mic size={12} /> Speak again
          </button>
          <button type="button" className="speech-review-dismiss" onClick={() => setSpeechPreview(null)} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}

export function QuizTextareaMic({ value, onChange }) {
  const [listening, setListening] = useState(false);
  const [speechPreview, setSpeechPreview] = useState(null);
  const recognitionRef = useRef(null);

  const toggleSpeech = useCallback((replaceAll = false) => {
    if (!SpeechRecognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (replaceAll) {
      onChange('');
      setSpeechPreview(null);
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      if (transcript) {
        onChange((replaceAll ? '' : value ? value + ' ' : '') + transcript);
        setSpeechPreview(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, value, onChange]);

  return (
    <div className="quiz-textarea-mic-wrap">
      <button
        type="button"
        className={`quiz-mic-btn quiz-mic-btn-textarea ${listening ? 'listening' : ''}`}
        onClick={() => toggleSpeech(false)}
        title={listening ? 'Tap to stop' : 'Speak a paragraph'}
        aria-label={listening ? 'Tap to stop listening' : 'Speak a paragraph'}
      >
        {listening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
      {listening && <small className="quiz-speak-hint">Speak your whole paragraph, then tap the mic to stop.</small>}
      {speechPreview && (
        <div className="speech-review-bar speech-review-bar-quiz speech-review-bar-textarea">
          <span className="speech-review-text">We heard: &quot;{speechPreview.length > 40 ? speechPreview.slice(0, 40) + '…' : speechPreview}&quot;</span>
          <button type="button" className="speech-review-again" onClick={() => toggleSpeech(true)}>
            <Mic size={12} /> Speak again
          </button>
          <button type="button" className="speech-review-dismiss" onClick={() => setSpeechPreview(null)} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}
