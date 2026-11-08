import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { createQueryClient } from './api/queryClient';
import './index.css';

// There is no real backend: the mock API (MSW) must be running before the first request.
// It is loaded with a dynamic import so it lands in its own chunk.
async function startMockApi() {
  const [{ worker }, { configureFromSearch }, { resetDb }] = await Promise.all([
    import('./mocks/browser'),
    import('./mocks/config'),
    import('./mocks/db'),
  ]);
  if (configureFromSearch(window.location.search).reset) resetDb();
  await worker.start({ onUnhandledFrame: 'bypass', quiet: import.meta.env.PROD });
}

const queryClient = createQueryClient();

void startMockApi().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
});
