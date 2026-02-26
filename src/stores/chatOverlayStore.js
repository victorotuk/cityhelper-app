import { create } from 'zustand';

export const useChatOverlayStore = create((set) => ({
  isOpen: false,
  context: null, // { page, selectedItem: { id, name, category } }
  open: (context) => set({ isOpen: true, context: context || null }),
  close: () => set({ isOpen: false, context: null }),
  setContext: (context) => set({ context }),
}));
