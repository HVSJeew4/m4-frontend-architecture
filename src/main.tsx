import { startTransition, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { setBeforeFirstRequest } from './api/client';
import { createQueryClient } from './api/queryClient';
import { ROUTER_FUTURE } from './utils/routerFuture';
import './index.css';

// There is no real backend: the mock API (MSW) answers every /api request. It is its own chunk
// (dynamic import) and starts on the first API request – the login page never needs it until
// "Sign in" is pressed, so it costs that page nothing.
async function startMockApi() {
  const [{ worker }, { configureFromSearch }, { resetDb }] = await Promise.all([
    import('./mocks/browser'),
    import('./mocks/config'),
    import('./mocks/db'),
  ]);
  const { reset, userCount } = configureFromSearch(window.location.search);
  if (reset || userCount) resetDb(userCount);
  await worker.start({ onUnhandledFrame: 'bypass', quiet: import.meta.env.PROD });
}

setBeforeFirstRequest(startMockApi);

const root = createRoot(document.getElementById('root')!);
// A transition lets React render the first frame in small slices, yielding to the browser in
// between, instead of one long task that blocks input (lower Total Blocking Time on slow phones).
startTransition(() => {
  root.render(
    <StrictMode>
      <QueryClientProvider client={createQueryClient()}>
        <BrowserRouter future={ROUTER_FUTURE}>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
});
