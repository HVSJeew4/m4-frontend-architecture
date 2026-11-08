import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { useDebounce } from '@/hooks/useDebounce';
import type { UserListParams } from '@/types/user';
import type { useUserListParams } from './useUserListParams';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'user', label: 'User' },
];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface UserFiltersProps {
  params: UserListParams;
  update: ReturnType<typeof useUserListParams>['update'];
}

export function UserFilters({ params, update }: UserFiltersProps) {
  // The input updates on every key; the URL (and so the request) only 300 ms after typing stops.
  const [query, setQuery] = useState(params.search ?? '');
  const debouncedQuery = useDebounce(query.trim(), 300);
  // Only push to the URL when the *typed* search changed. Otherwise pressing Back (which changes
  // the URL) would be undone at once by writing the old search back.
  const lastSent = useRef(debouncedQuery);

  useEffect(() => {
    if (debouncedQuery === lastSent.current) return;
    lastSent.current = debouncedQuery;
    if (debouncedQuery !== (params.search ?? '')) {
      // replace: typing should not add one history entry per search.
      update({ search: debouncedQuery }, { replace: true });
    }
  }, [debouncedQuery, params.search, update]);

  return (
    <div role="search" aria-label="Filter users" className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
      <div className="relative">
        <Input
          label="Search by name or email"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. Perera"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 bottom-1.5 rounded px-2 py-1 text-sm font-medium text-blue-800 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
          >
            Clear <span className="sr-only">search</span>
          </button>
        )}
      </div>
      <Select
        label="Role"
        placeholder="All roles"
        options={ROLE_OPTIONS}
        value={params.role ?? ''}
        onChange={(event) => update({ role: event.target.value })}
      />
      <Select
        label="Status"
        placeholder="Any status"
        options={STATUS_OPTIONS}
        value={params.status ?? ''}
        onChange={(event) => update({ status: event.target.value })}
      />
    </div>
  );
}
