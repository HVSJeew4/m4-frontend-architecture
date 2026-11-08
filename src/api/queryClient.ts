import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dashboard data does not change second by second; avoid refetching on every mount.
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}
