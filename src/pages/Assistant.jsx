import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Loader } from 'lucide-react';
import { APP_CONFIG } from '../lib/config';
import { supabase } from '../lib/supabase';

export default function Assistant() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hey! 👋 I'm your compliance assistant — you can do everything through me, no clicking needed.\n\n**I can:**\n• **Track** — Add, list, filter, mark done, snooze, share items\n• **Estate** — Add executors, nominees, trustees to your estate plan\n• **Business** — Add corporations, LLCs, locations\n• **Guides** — "How do I apply for a work permit?" or "I want to start a trust and nest a corporation inside it" — I'll give you step-by-step guidance\n• **Applications** — Work permit, study permit, visitor visa, PR card\n\nJust tell me what you need. What can I help you with?`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
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
        body: { messages: chatMessages }
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
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add my Netflix renewal March 15, or ask anything..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
