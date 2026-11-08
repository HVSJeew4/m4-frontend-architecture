import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { mockConfig } from '@/mocks/config';
import { resetDb } from '@/mocks/db';
import { server } from '@/mocks/node';
import { useNotificationStore } from '@/stores/notificationStore';
import { installMatchMedia, setSystemPrefersDark } from './matchMedia';

installMatchMedia();

// findBy*/waitFor wait up to 3 s (default 1 s): with all test files running in parallel, a mock
// API round trip plus React rendering can take longer than 1 s on a busy machine.
configure({ asyncUtilTimeout: 3000 });

// jsdom has no layout: every element measures 0×0. Elements with an explicit inline height (like
// VirtualList's scroll box) report that height as clientHeight – what TanStack Virtual reads – so
// it can work out which rows are visible. Everything else keeps jsdom's normal 0.
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get(this: HTMLElement) {
    return parseFloat(this.style.height) || 0;
  },
});
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get(this: HTMLElement) {
    return this.style.height ? 800 : 0;
  },
});

// jsdom has no layout engine, so no ResizeObserver; useElementWidth (the chart) needs one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Every request in a test must hit a mock handler; an unknown URL is a bug in the test or the app.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mockConfig.latencyMs = 0;
  mockConfig.fail.clear();
  resetDb();
  // Zustand stores are module-level singletons: reset them so no toast leaks into the next test.
  useNotificationStore.setState({ toasts: [] });
  setSystemPrefersDark(false);
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
