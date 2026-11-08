import { memo } from 'react';
import { useAllUsers, type UserListFilters } from '@/api/users';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState, Skeleton } from '@/components/common/Skeleton';
import { VirtualList } from '@/components/common/VirtualList';
import type { User } from '@/types/user';
import { formatNumber } from '@/utils/format';
import { RowActions, StatusBadge } from './UserRowParts';

const ROW_HEIGHT = 72;
const LIST_HEIGHT = 560;

interface UsersDirectoryProps {
  filters: UserListFilters;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/** Every matching user in one scrollable list – fine for thousands, because it is virtualised. */
export function UsersDirectory({ filters, currentUserId, onEdit, onDelete }: UsersDirectoryProps) {
  const { data, isPending, isError, error, refetch } = useAllUsers(filters);

  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="min-h-5 text-sm text-slate-700">
        {data && `${formatNumber(data.total)} ${data.total === 1 ? 'user' : 'users'} found`}
      </p>
      {isError && (
        <ErrorState title="Could not load users" error={error} onRetry={() => refetch()} />
      )}
      {isPending && (
        <>
          <LoadingState label="Loading users" />
          <Skeleton className="h-[560px] w-full" />
        </>
      )}
      {data && data.items.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-surface px-4 py-10 text-center text-slate-700">
          No users match these filters.
        </p>
      )}
      {data && data.items.length > 0 && (
        <VirtualList
          label="All users"
          items={data.items}
          height={LIST_HEIGHT}
          itemHeight={ROW_HEIGHT}
          getKey={(user) => user.id}
          renderItem={(user) => (
            <UserRow
              user={user}
              isSelf={user.id === currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        />
      )}
    </div>
  );
}

interface UserRowProps {
  user: User;
  isSelf: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

// memo (the brief's UserCard example): while scrolling, rows that stay on screen do not re-render.
const UserRow = memo(function UserRow({ user, isSelf, onEdit, onDelete }: UserRowProps) {
  return (
    <div className="flex h-full items-center gap-3 px-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">
          {user.name}
          {isSelf && <span className="ml-1 font-normal text-slate-600">(you)</span>}
        </p>
        <p className="truncate text-sm text-slate-600">
          {user.email} · <span className="capitalize">{user.role}</span>
        </p>
      </div>
      <StatusBadge active={user.isActive} />
      <RowActions user={user} isSelf={isSelf} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
});
