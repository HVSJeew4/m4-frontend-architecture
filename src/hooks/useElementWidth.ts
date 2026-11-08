import { useCallback, useRef, useSyncExternalStore } from 'react';

/**
 * Width of an element in CSS pixels, kept up to date with a ResizeObserver. Uses
 * useSyncExternalStore (React's way to read an outside value) rather than setState in an effect.
 * Returns `fallback` before the element is measured (and where there is no layout, e.g. tests).
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);

  const subscribe = useCallback((onChange: () => void) => {
    const element = ref.current;
    if (!element) return () => {};
    const observer = new ResizeObserver(onChange);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const width = useSyncExternalStore(
    subscribe,
    () => ref.current?.clientWidth || fallback,
    () => fallback,
  );
  return [ref, width] as const;
}
