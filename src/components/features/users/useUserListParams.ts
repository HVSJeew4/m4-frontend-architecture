import { useSearchParams } from 'react-router-dom';
import { ROLES, type UserListParams, type UserSortField } from '@/types/user';

export const PAGE_SIZES = [10, 25, 50];
const SORT_FIELDS: readonly UserSortField[] = ['name', 'email', 'role', 'isActive', 'createdAt'];
const DEFAULTS = { page: 1, pageSize: 10, sortBy: 'createdAt', sortOrder: 'desc' } as const;

type ParamChanges = Partial<Record<keyof UserListParams, string | number | undefined>>;

/**
 * The users list state (page, sort, filters, search) lives in the URL, not in component state:
 * reload, back/forward and shared links all restore the same view. Invalid values fall back to
 * defaults, because anyone can type anything into a URL.
 */
export function useUserListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const get = (key: string) => searchParams.get(key) ?? undefined;

  const page = Number(get('page'));
  const pageSize = Number(get('pageSize'));
  const role = get('role');
  const status = get('status');
  const sortBy = get('sortBy');

  const params: UserListParams = {
    page: Number.isInteger(page) && page > 0 ? page : DEFAULTS.page,
    pageSize: PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULTS.pageSize,
    sortBy: SORT_FIELDS.includes(sortBy as UserSortField)
      ? (sortBy as UserSortField)
      : DEFAULTS.sortBy,
    sortOrder: get('sortOrder') === 'asc' ? 'asc' : DEFAULTS.sortOrder,
    search: get('search'),
    role: (ROLES as readonly string[]).includes(role ?? '')
      ? (role as UserListParams['role'])
      : undefined,
    status: status === 'active' || status === 'inactive' ? status : undefined,
  };

  /** Changing a filter, sort or search goes back to page 1, so the user never lands on an empty page. */
  function update(changes: ParamChanges, { replace = false } = {}) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === '') next.delete(key);
          else next.set(key, String(value));
        }
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace },
    );
  }

  /** Same column flips the order; a new column starts ascending. */
  function toggleSort(field: string) {
    const order = params.sortBy === field && params.sortOrder === 'asc' ? 'desc' : 'asc';
    update({ sortBy: field, sortOrder: order });
  }

  return { params, update, toggleSort };
}
