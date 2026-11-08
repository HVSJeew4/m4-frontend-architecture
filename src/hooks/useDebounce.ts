import { useEffect, useState } from 'react';

/**
 * The brief's `useDebouncedSearch`, made generic: returns `value` only once it has stopped
 * changing for `delay` ms. Each change clears the previous timer, so typing "ada" quickly
 * produces one search instead of three.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
