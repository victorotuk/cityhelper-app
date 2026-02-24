/**
 * Holds pending shared/pasted text for Smart Suggestions.
 * When user shares text to the app or we receive it from Share Target,
 * we store it here. Dashboard reads it and opens Add modal with parsed suggestion.
 * All processing is on-device. We never send this to our servers.
 */
import { create } from 'zustand';

export const useSharedSuggestStore = create((set) => ({
  pendingText: null,

  setPendingText: (text) => set({ pendingText: text }),

  clearPendingText: () => set({ pendingText: null }),
}));
