import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Loader, Mic, MicOff, Maximize2, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../lib/config';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function ChatPanel({ context, compact = false, onClose, initialPrompt = '' }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { messages, loading, addMessage, setMessages, removeMessage, clearMessages, setLoading, init } = useChatStore();
  const [persona, setPersona] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [input, setInput] = useState('');
  const [speechPreview, setSpeechPreview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) init(user.id);
  }, [user?.id, init]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) setInput(initialPrompt.trim());
  }, [initialPrompt]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('user_settings').select('persona').eq('user_id', user.id).single()
      .then(({ data }) => data?.persona && setPersona(data.persona));
  }, [user?.id]);

  const toggleSpeech = useCallback((replaceAll = false) => {
    if (!SpeechRecognition) {
      addMessage({ role: 'assistant', content: "Speech recognition isn't supported in your browser. Try Chrome or Edge." });
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (replaceAll) {
      setInput('');
      setSpeechPreview(null);
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ').trim();
      if (transcript) {
        setInput(prev => (replaceAll ? '' : prev ? prev + ' ' : '') + transcript.trim());
        setSpeechPreview(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  const dismissSpeechPreview = useCallback(() => setSpeechPreview(null), []);
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setSpeechPreview(null);

    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const chatMessages = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const apiKey = user?.id ? localStorage.getItem(`nava_groq_key_${user.id}`) || undefined : undefined;
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: chatMessages,
          persona: persona || undefined,
          context: context || undefined,
          apiKey: apiKey || undefined
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const replyText = data.backup_used
        ? 'We used a backup AI provider for this response (your usual one may be having issues).\n\n' + data.reply
        : data.reply;
      addMessage({ role: 'assistant', content: replyText });

      if (data.calendarExport?.ics) {
        const blob = new Blob([data.calendarExport.ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nava-deadlines.ics';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Chat error:', err);
      addMessage({
        role: 'assistant',
        content: `Sorry, I'm having trouble connecting right now. Please try again in a moment!\n\n(${err.message})`
      });
    }

    setLoading(false);
  };

  return (
    <div className={`chat-panel ${compact ? 'chat-panel-compact' : ''}`}>
      <div className="chat-container">
        <div className="status-bar">
          <span className="status-dot"></span>
          {APP_CONFIG.name} AI
          {messages.length > 1 && (
            <button
              type="button"
              className="chat-clear-btn"
              onClick={clearMessages}
              title="Clear chat"
            >
              <Trash2 size={14} />
              Clear
            </button>
          )}
          {compact && onClose && (
            <button
              type="button"
              className="chat-expand-btn"
              onClick={() => { onClose(); navigate('/assistant'); }}
              title="Open full chat"
            >
              <Maximize2 size={16} />
              Expand
            </button>
          )}
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? '🤖' : <User size={20} />}
              </div>
              <div className="message-content">
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} dangerouslySetInnerHTML={{
                    __html: line
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }} />
                ))}
                <button
                  type="button"
                  className="message-delete-btn"
                  onClick={() => removeMessage(i)}
                  title="Delete message"
                  aria-label="Delete message"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-content typing">
                <Loader size={16} className="spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={sendMessage}>
          <div className="chat-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (speechPreview) setSpeechPreview(null);
              }}
              placeholder="Type or speak..."
              disabled={loading}
            />
            {SpeechRecognition && (
              <button
                type="button"
                className={`chat-mic-btn ${listening ? 'listening' : ''}`}
                onClick={() => toggleSpeech(false)}
                disabled={loading}
                title={listening ? 'Tap to stop' : 'Speak'}
                aria-label={listening ? 'Stop listening' : 'Speak'}
              >
                {listening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            )}
            <button type="submit" disabled={loading || !input.trim()}>
              <Send size={20} />
            </button>
          </div>
          {listening && <div className="speech-listening-hint">Speak, then tap mic to stop.</div>}
          {speechPreview && (
            <div className="speech-review-bar">
              <span className="speech-review-text">We heard: &quot;{speechPreview.length > 50 ? speechPreview.slice(0, 50) + '…' : speechPreview}&quot;</span>
              <button type="button" className="speech-review-again" onClick={() => toggleSpeech(true)}>
                <Mic size={14} /> Again
              </button>
              <button type="button" className="speech-review-dismiss" onClick={dismissSpeechPreview} aria-label="Dismiss">×</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
