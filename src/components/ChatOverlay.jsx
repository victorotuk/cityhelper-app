import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useChatOverlayStore } from '../stores/chatOverlayStore';
import ChatPanel from './ChatPanel';

export default function ChatOverlay() {
  const { isOpen, close, context } = useChatOverlayStore();
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const chatContext = context || { page: location.pathname };

  return (
    <div className="chat-overlay" role="dialog" aria-label="AI chat">
      <div className="chat-overlay-backdrop" aria-hidden="true" />
      <div className="chat-overlay-panel">
        <div className="chat-overlay-header">
          <span className="chat-overlay-title">AI Help</span>
          <button
            type="button"
            className="chat-overlay-close"
            onClick={close}
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
        <ChatPanel
          context={chatContext}
          compact
          onClose={close}
        />
      </div>
    </div>
  );
}
