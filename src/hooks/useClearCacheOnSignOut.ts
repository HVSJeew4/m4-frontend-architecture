import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

/**
 * Empties the React Query cache whenever the user signs out (or the session expires), so the
 * next person on this browser never sees the previous admin's data. Kept out of the store so the
 * store does not need to know about React Query.
 */
export function useClearCacheOnSignOut(): void {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (previous.user && !state.user) queryClient.clear();
      }),
    [queryClient],
  );
}
