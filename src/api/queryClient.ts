import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dashboard data does not change second by second; avoid refetching on every mount.
        staleTime: 30_000,
        // Retry once for network/server errors; a 4xx will not fix itself, so fail fast.
        retry: (failureCount, error) =>
          failureCount < 1 && !(error instanceof ApiError && error.status < 500),
      },
    },
  });
}
