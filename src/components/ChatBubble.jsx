import { Link } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function ChatBubble() {
  const [showTooltip, setShowTooltip] = useState(true);

  return (
    <div className="chat-bubble-container">
      {showTooltip && (
        <div className="chat-tooltip">
          <button 
            className="tooltip-close" 
            onClick={(e) => { e.preventDefault(); setShowTooltip(false); }}
          >
            <X size={12} />
          </button>
          <span>Need help? Ask me anything!</span>
        </div>
      )}
      <Link to="/assistant" className="chat-bubble">
        <MessageCircle size={24} />
        <span className="chat-bubble-label">AI Help</span>
      </Link>
    </div>
  );
}

