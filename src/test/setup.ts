import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { mockConfig } from '@/mocks/config';
import { resetDb } from '@/mocks/db';
import { server } from '@/mocks/node';
import { useNotificationStore } from '@/stores/notificationStore';

// findBy*/waitFor wait up to 3 s (default 1 s): with all test files running in parallel, a mock
// API round trip plus React rendering can take longer than 1 s on a busy machine.
configure({ asyncUtilTimeout: 3000 });

// jsdom cannot lay out an SVG chart (no layout engine: width 0, nothing drawn), and loading
// Recharts in every test file made the suite slow. The chart's data is tested through its
// accessible data table instead; the chart itself is checked in a real browser.
vi.mock('@/components/features/dashboard/TrendChart', () => ({ default: () => null }));

// jsdom has no layout engine, so no ResizeObserver; Recharts' ResponsiveContainer needs one.
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
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
