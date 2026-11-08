import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationList } from '@/types/notification';
import { apiFetch } from './client';

export const notificationKeys = { all: ['notifications'] as const };

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: ({ signal }) => apiFetch<NotificationList>('/api/notifications', { signal }),
    // Poll so new server notifications (e.g. from other admins) show up without a reload.
    refetchInterval: 60_000,
  });
}

/** Optimistic: the item looks read immediately; rolled back if the request fails. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string, NotificationList | undefined>({
    mutationFn: (id) =>
      apiFetch(`/api/notifications/${id}`, { method: 'PATCH', body: { read: true } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });
      const previous = queryClient.getQueryData<NotificationList>(notificationKeys.all);
      if (previous) {
        const items = previous.items.map((n) => (n.id === id ? { ...n, read: true } : n));
        queryClient.setQueryData<NotificationList>(notificationKeys.all, {
          items,
          unreadCount: items.filter((n) => !n.read).length,
        });
      }
      return previous;
    },
    onError: (_error, _id, previous) => {
      if (previous) queryClient.setQueryData(notificationKeys.all, previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<NotificationList>('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: (list) => queryClient.setQueryData(notificationKeys.all, list),
  });
}
