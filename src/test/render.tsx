import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ROUTER_FUTURE } from '@/utils/routerFuture';

/** Renders UI with a fresh React Query cache (no retries) and an in-memory router. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]} future={ROUTER_FUTURE}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}
