import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useChatOverlayStore } from '../stores/chatOverlayStore';

export default function ChatBubble() {
  const [showTooltip, setShowTooltip] = useState(true);
  const open = useChatOverlayStore((s) => s.open);
  const location = useLocation();

  const handleClick = (e) => {
    e.preventDefault();
    open({ page: location.pathname });
  };

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
      <button
        type="button"
        className="chat-bubble"
        onClick={handleClick}
        aria-label="Open AI help"
      >
        <MessageCircle size={24} />
        <span className="chat-bubble-label">AI Help</span>
      </button>
    </div>
  );
}
