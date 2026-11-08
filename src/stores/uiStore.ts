import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const DARK_QUERY = '(prefers-color-scheme: dark)';

interface UiState {
  /** 'system' until the user picks a theme with the toggle. */
  theme: Theme;
  toggleTheme: () => void;
}

export const systemPrefersDark = () => window.matchMedia(DARK_QUERY).matches;

export const resolveTheme = (theme: Theme): ResolvedTheme =>
  theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;

/** Tailwind's `dark:` styles (and the colour tokens in index.css) key off this class on <html>. */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  // Native controls (scrollbars, date pickers) follow too.
  root.style.colorScheme = resolved;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      // Switches to the opposite of what is on screen now, so the first click always does
      // something visible – even when the theme is still following the system.
      toggleTheme: () => set({ theme: resolveTheme(get().theme) === 'dark' ? 'light' : 'dark' }),
    }),
    {
      // localStorage (not sessionStorage like the session): a theme choice should outlive the tab.
      // index.html reads this key before React starts, to avoid a flash of the wrong theme.
      name: 'adminflow:ui',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ theme }) => ({ theme }),
    },
  ),
);
