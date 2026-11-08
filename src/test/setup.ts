import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { mockConfig } from '@/mocks/config';
import { resetDb } from '@/mocks/db';
import { server } from '@/mocks/node';

// Every request in a test must hit a mock handler; an unknown URL is a bug in the test or the app.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  mockConfig.latencyMs = 0;
  mockConfig.fail.clear();
  resetDb();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
