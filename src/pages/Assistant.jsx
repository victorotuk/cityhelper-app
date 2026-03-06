import { useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import ChatPanel from '../components/chat/ChatPanel';

export default function Assistant() {
  const location = useLocation();
  const context = { page: location.pathname };
  const initialPrompt = location.state?.initialPrompt || '';

  return (
    <div className="assistant-page">
      <PageHeader backTo="/dashboard" title="AI Assistant" icon={<Bot size={24} />} />

      <main className="assistant-main">
        <ChatPanel context={context} initialPrompt={initialPrompt} />
      </main>
    </div>
  );
}
