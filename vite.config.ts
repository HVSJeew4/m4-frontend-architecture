import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Tests use MSW in Node; a stale handler from one test must not leak into the next.
    restoreMocks: true,
    // Integration tests type key by key and wait for the mock API; 5 s (default) is too tight
    // when all files run in parallel.
    testTimeout: 15_000,
  },
});
