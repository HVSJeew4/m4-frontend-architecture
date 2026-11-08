import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Paginated } from '@/types/api';
import type { User, UserInput, UserListParams } from '@/types/user';
import { apiFetch } from './client';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  // Under lists(), so invalidation and the optimistic edit cover the full list too.
  everything: (filters: UserListFilters) => [...userKeys.lists(), 'all', filters] as const,
};

/** Sort and filters without paging – for the virtual list, which gets every matching user. */
export type UserListFilters = Omit<UserListParams, 'page' | 'pageSize'>;

function toQueryString(params: Partial<UserListParams> & { all?: 1 }): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  return search.toString();
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: ({ signal }) =>
      apiFetch<Paginated<User>>(`/api/users?${toQueryString(params)}`, { signal }),
    // Keep showing the current page while the next one loads, instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  });
}

/** Every user matching the filters, in one request (rendered with a virtual list). */
export function useAllUsers(filters: UserListFilters) {
  return useQuery({
    queryKey: userKeys.everything(filters),
    queryFn: ({ signal }) =>
      apiFetch<Paginated<User>>(`/api/users?${toQueryString({ ...filters, all: 1 })}`, {
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserInput) => apiFetch<User>('/api/users', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

type ListSnapshot = [readonly unknown[], Paginated<User> | undefined][];

/**
 * Optimistic update: the edited row changes in every cached list at once, before the server
 * answers. If the server refuses, every list is put back exactly as it was.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<User, Error, { id: string; input: Partial<UserInput> }, ListSnapshot>({
    mutationFn: ({ id, input }) =>
      apiFetch<User>(`/api/users/${id}`, { method: 'PATCH', body: input }),
    onMutate: async ({ id, input }) => {
      // Stop in-flight refetches so they cannot overwrite the optimistic value.
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      const snapshot = queryClient.getQueriesData<Paginated<User>>({ queryKey: userKeys.lists() });
      queryClient.setQueriesData<Paginated<User>>(
        { queryKey: userKeys.lists() },
        (page) =>
          page && {
            ...page,
            items: page.items.map((user) => (user.id === id ? { ...user, ...input } : user)),
          },
      );
      return snapshot;
    },
    onError: (_error, _variables, snapshot) => {
      for (const [key, data] of snapshot ?? []) queryClient.setQueryData(key, data);
    },
    // Either way, refetch so sorting/filtering reflect the server's truth.
    onSettled: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<User>(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useRestoreUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<User>(`/api/users/${id}/restore`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}
