import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Loader, Mic, MicOff } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function Assistant() {
  const { user } = useAuthStore();
  const [persona, setPersona] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hey! 👋 I'm your compliance assistant — you can do everything through me, no clicking needed.\n\n**I can:**\n• **Track** — Add, list, filter, mark done, snooze, share items\n• **Estate** — Add executors, nominees, trustees to your estate plan\n• **Business** — Add corporations, LLCs, locations\n• **Guides** — "How do I apply for a work permit?" or "I want to start a trust and nest a corporation inside it" — I'll give you step-by-step guidance\n• **Applications** — Work permit, study permit, visitor visa, PR card\n\nJust tell me what you need. What can I help you with?`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechPreview, setSpeechPreview] = useState(null); // { text } when we just got speech — user can review
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('user_settings').select('persona').eq('user_id', user.id).single()
      .then(({ data }) => data?.persona && setPersona(data.persona));
  }, [user?.id]);

  const toggleSpeech = useCallback((replaceAll = false) => {
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Speech recognition isn't supported in your browser. Try Chrome or Edge." }]);
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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      if (transcript.trim()) {
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
      // Send to backend AI function
      const chatMessages = newMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: chatMessages, persona: persona || undefined }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I'm having trouble connecting right now. Please try again in a moment!\n\n(${err.message})`
      }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="assistant-page">
      <header className="page-header">
        <Link to="/dashboard" className="back-btn">
          <ArrowLeft size={20} />
          Back
        </Link>
        <div className="header-title">
          <Bot size={24} />
          <span>AI Assistant</span>
        </div>
        <div style={{ width: 60 }} />
      </header>

      <main className="assistant-main">
        <div className="chat-container">
          {/* Status bar */}
          <div className="status-bar">
            <span className="status-dot"></span>
            {APP_CONFIG.name} AI
          </div>
          
          {/* Messages */}
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

          {/* Input */}
          <form className="chat-input" onSubmit={sendMessage}>
            <div className="chat-input-row">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (speechPreview) setSpeechPreview(null);
                }}
                placeholder="Type, tap mic to speak, or ask anything..."
                disabled={loading}
              />
              {SpeechRecognition && (
                <button
                  type="button"
                  className={`chat-mic-btn ${listening ? 'listening' : ''}`}
                  onClick={() => toggleSpeech(false)}
                  disabled={loading}
                  title={listening ? 'Stop listening' : 'Speak'}
                  aria-label={listening ? 'Stop listening' : 'Speak'}
                >
                  {listening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              <button type="submit" disabled={loading || !input.trim()}>
                <Send size={20} />
              </button>
            </div>
            {speechPreview && (
              <div className="speech-review-bar">
                <span className="speech-review-text">We heard: &quot;{speechPreview.length > 60 ? speechPreview.slice(0, 60) + '…' : speechPreview}&quot;</span>
                <span className="speech-review-hint">Review before sending.</span>
                <button type="button" className="speech-review-again" onClick={() => toggleSpeech(true)}>
                  <Mic size={14} /> Speak again
                </button>
                <button type="button" className="speech-review-dismiss" onClick={dismissSpeechPreview} aria-label="Dismiss">
                  ×
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
