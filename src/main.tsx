import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { setApiReady } from './api/client';
import { createQueryClient } from './api/queryClient';
import { ROUTER_FUTURE } from './utils/routerFuture';
import './index.css';

// There is no real backend: the mock API (MSW) answers every /api request. It is a separate
// chunk (dynamic import), and only API requests wait for it – the page itself renders at once.
async function startMockApi() {
  const [{ worker }, { configureFromSearch }, { resetDb }] = await Promise.all([
    import('./mocks/browser'),
    import('./mocks/config'),
    import('./mocks/db'),
  ]);
  if (configureFromSearch(window.location.search).reset) resetDb();
  await worker.start({ onUnhandledFrame: 'bypass', quiet: import.meta.env.PROD });
}

setApiReady(startMockApi());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={createQueryClient()}>
      <BrowserRouter future={ROUTER_FUTURE}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
