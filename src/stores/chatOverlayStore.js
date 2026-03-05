import { create } from 'zustand';

export const useChatOverlayStore = create((set) => ({
  isOpen: false,
  context: null, // { page, selectedItem, country }
  open: (context) => set((s) => ({ isOpen: true, context: { ...s.context, ...(context || {}) } })),
  close: () => set({ isOpen: false, context: null }),
  setContext: (context) => set((s) => ({ context: { ...s.context, ...context } })),
}));
