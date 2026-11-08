import { useLayoutEffect, useSyncExternalStore } from 'react';
import { applyTheme, DARK_QUERY, useUiStore, type ResolvedTheme } from '@/stores/uiStore';

function subscribeToSystemTheme(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** The theme on screen: the user's choice, or the OS setting (live – it follows OS changes). */
export function useResolvedTheme(): ResolvedTheme {
  const theme = useUiStore((state) => state.theme);
  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    () => window.matchMedia(DARK_QUERY).matches,
  );
  if (theme === 'system') return systemDark ? 'dark' : 'light';
  return theme;
}

/** Keeps the `dark` class on <html> in sync. Call once, at the top of the app. */
export function useApplyTheme(): void {
  const resolved = useResolvedTheme();
  // Layout effect: applied before the browser paints, so there is no flash of the old theme.
  useLayoutEffect(() => applyTheme(resolved), [resolved]);
}
