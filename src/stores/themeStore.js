import { create } from 'zustand';

const STORAGE_KEY = 'nava_theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return 'light';
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

// Apply on load (before React) so no flash
if (typeof document !== 'undefined') {
  const initial = getInitialTheme();
  document.documentElement.setAttribute('data-theme', initial);
}

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    if (theme !== 'light' && theme !== 'dark') return;
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return { theme: next };
    });
  },
}));
