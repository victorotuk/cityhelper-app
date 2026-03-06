import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useChatOverlayStore } from '../../stores/chatOverlayStore';

export default function ChatBubble() {
  const [showTooltip, setShowTooltip] = useState(true);
  const open = useChatOverlayStore((s) => s.open);
  const location = useLocation();

  const handleClick = (e) => {
    e.preventDefault();
    open({ page: location.pathname });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('chat-bubble-drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('chat-bubble-drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('chat-bubble-drag-over');
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const { prompt } = JSON.parse(raw);
      if (prompt) open({ page: location.pathname, initialPrompt: prompt });
    } catch {
      // ignore parse errors
    }
  };

  return (
    <div className="chat-bubble-container">
      {showTooltip && (
        <div className="chat-tooltip">
          <button
            type="button"
            className="tooltip-close"
            onClick={(e) => { e.preventDefault(); setShowTooltip(false); }}
          >
            <X size={12} />
          </button>
          <span>Need help? Drag a card here or ask me anything!</span>
        </div>
      )}
      <div
        className="chat-bubble-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
    </div>
  );
}
