import { create } from 'zustand';

const STORAGE_KEY = (userId) => `nava_chat_${userId}`;

const WELCOME_MSG = `Hey! 👋 I'm your compliance assistant — you can do everything through me, no clicking needed.

**I can:**
• **Trusts & Estate** — "How do I set up a trust?" "What's a holding company?" — I'll walk you through wealth structures, the Rothschild method, executors, beneficiaries
• **Business** — Add corporations, LLCs, holding companies, locations
• **Track** — Add, list, filter, mark done, snooze, share items
• **Guides** — Work permits, visas, licenses — and anything about building wealth through structure
• **Applications** — Work permit, study permit, visitor visa, PR card

Want to become an expert in trusts and wealth-building? Just ask. What can I help you with?`;

const save = (userId, messages) => {
  if (userId && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY(userId), JSON.stringify(messages));
  }
};

export const useChatStore = create((set, get) => ({
  messages: [{ role: 'assistant', content: WELCOME_MSG }],
  currentUserId: null,
  loading: false,

  init: (userId) => {
    if (!userId) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY(userId));
      const parsed = raw ? JSON.parse(raw) : null;
      const messages = Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : [{ role: 'assistant', content: WELCOME_MSG }];
      set({ messages, currentUserId: userId });
    } catch {
      set({ messages: [{ role: 'assistant', content: WELCOME_MSG }], currentUserId: userId });
    }
  },

  addMessage: (msg) => {
    const { messages, currentUserId } = get();
    const next = [...messages, msg];
    save(currentUserId, next);
    set({ messages: next });
  },

  setMessages: (msgs) => {
    const { currentUserId } = get();
    const next = Array.isArray(msgs) ? msgs : [];
    save(currentUserId, next);
    set({ messages: next });
  },

  removeMessage: (index) => {
    const { messages, currentUserId } = get();
    let next = messages.filter((_, i) => i !== index);
    if (next.length === 0) next = [{ role: 'assistant', content: WELCOME_MSG }];
    save(currentUserId, next);
    set({ messages: next });
  },

  clearMessages: () => {
    const next = [{ role: 'assistant', content: WELCOME_MSG }];
    save(get().currentUserId, next);
    set({ messages: next });
  },

  setLoading: (loading) => set({ loading }),
}));
