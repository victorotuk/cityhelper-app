import { useState } from 'react';
import { Sparkles, MessageCircle, Loader, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useChatOverlayStore } from '../stores/chatOverlayStore';

export default function AISuggestionsCard() {
  const { user } = useAuthStore();
  const openChat = useChatOverlayStore((s) => s.open);
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuggestions = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const { data: personaData } = await supabase
        .from('user_settings')
        .select('persona')
        .eq('user_id', user.id)
        .single();

      const { data, error: err } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [{ role: 'user', content: 'What should I focus on today? Give me 2-3 very short bullet suggestions based on my items. Be specific and actionable.' }],
          persona: personaData?.persona || undefined,
          context: { page: '/dashboard' }
        }
      });

      if (err) throw err;
      if (data?.error) throw new Error(data.error);
      setSuggestions(data?.reply || '');
    } catch (e) {
      setError(e.message);
      setSuggestions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = () => {
    openChat({ page: '/dashboard' });
  };

  return (
    <div className="ai-suggestions-card">
      <div className="ai-suggestions-header">
        <Sparkles size={18} className="ai-suggestions-icon" />
        <span>AI suggests</span>
        <button
          type="button"
          className="ai-suggestions-refresh"
          onClick={fetchSuggestions}
          disabled={loading}
          title="Get suggestions"
        >
          {loading ? <Loader size={14} className="spin" /> : <RefreshCw size={14} />}
        </button>
      </div>
      {loading && !suggestions && (
        <p className="ai-suggestions-loading">Thinking...</p>
      )}
      {error && (
        <p className="ai-suggestions-error">{error}</p>
      )}
      {suggestions && !loading && (
        <div className="ai-suggestions-content">
          {suggestions.split('\n').filter(Boolean).map((line, i) => (
            <p key={i}>{line.replace(/^[-•*]\s*/, '').trim()}</p>
          ))}
        </div>
      )}
      {!suggestions && !loading && !error && (
        <p className="ai-suggestions-hint">Tap refresh to get personalized suggestions.</p>
      )}
      <button type="button" className="ai-suggestions-ask" onClick={handleAskAI}>
        <MessageCircle size={16} />
        Ask AI
      </button>
    </div>
  );
}
