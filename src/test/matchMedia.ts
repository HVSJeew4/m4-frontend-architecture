// jsdom has no matchMedia. This stub answers `(prefers-color-scheme: dark)` with a value tests can
// set, and notifies listeners when it changes (like the OS switching theme).
type Listener = (event: { matches: boolean }) => void;

let prefersDark = false;
const listeners = new Set<Listener>();

export function setSystemPrefersDark(value: boolean): void {
  prefersDark = value;
  for (const listener of listeners) listener({ matches: value });
}

export function installMatchMedia(): void {
  window.matchMedia = (query: string) =>
    ({
      get matches() {
        return query.includes('prefers-color-scheme: dark') ? prefersDark : false;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
      addListener: (listener: Listener) => listeners.add(listener),
      removeListener: (listener: Listener) => listeners.delete(listener),
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
