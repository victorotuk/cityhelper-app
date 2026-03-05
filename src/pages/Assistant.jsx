import { Link } from 'react-router-dom';
import { ArrowLeft, Bot } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ChatPanel from '../components/chat/ChatPanel';

export default function Assistant() {
  const location = useLocation();
  const context = { page: location.pathname };

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
        <ChatPanel context={context} />
      </main>
    </div>
  );
}
