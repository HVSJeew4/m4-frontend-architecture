import { memo } from 'react';
import { PencilIcon, TrashIcon } from '@/components/common/icons';
import { Table, type Column } from '@/components/common/Table';
import type { PaginationProps } from '@/components/common/Pagination';
import type { User, UserListParams } from '@/types/user';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';

interface UsersTableProps {
  users: User[];
  currentUserId?: string;
  params: UserListParams;
  isLoading: boolean;
  isFetching: boolean;
  pagination?: PaginationProps;
  onSortChange: (field: string) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

// No colour here: two text-* classes on one element would conflict (CSS order decides, not
// class order), so each button adds its own colour.
const iconButton =
  'inline-flex h-10 w-10 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none';

export function UsersTable({
  users,
  currentUserId,
  params,
  isLoading,
  isFetching,
  pagination,
  onSortChange,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      sortKey: 'name',
      render: (u) => (
        <>
          <span className="font-medium text-slate-900">{u.name}</span>
          {u.id === currentUserId && <span className="ml-1 text-slate-600">(you)</span>}
          <span className="block text-slate-600 sm:hidden">{u.email}</span>
        </>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortKey: 'email',
      className: 'hidden sm:table-cell',
      render: (u) => u.email,
    },
    {
      key: 'role',
      header: 'Role',
      sortKey: 'role',
      render: (u) => <span className="capitalize">{u.role}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'isActive',
      render: (u) => <StatusBadge active={u.isActive} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortKey: 'createdAt',
      className: 'hidden md:table-cell',
      render: (u) => <time dateTime={u.createdAt}>{formatDate(u.createdAt)}</time>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => (
        <RowActions user={u} isSelf={u.id === currentUserId} onEdit={onEdit} onDelete={onDelete} />
      ),
    },
  ];

  return (
    <>
      {/* The brief's aria-describedby="delete-help": extra context read with every delete button. */}
      <p id="delete-help" className="sr-only">
        Deleted users are hidden from the list and can be restored with Undo.
      </p>
      <Table
        caption="Users"
        captionHidden
        columns={columns}
        rows={users}
        getRowId={(u) => u.id}
        sort={{ by: params.sortBy, order: params.sortOrder }}
        onSortChange={onSortChange}
        isLoading={isLoading}
        isFetching={isFetching}
        emptyMessage="No users match these filters."
        pagination={pagination}
      />
    </>
  );
}

/** Status in words, not only colour. */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
        active ? 'bg-green-100 text-green-900' : 'bg-slate-200 text-slate-800',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// memo: a row's buttons re-render only when that user changes, not on every list update.
const RowActions = memo(function RowActions({
  user,
  isSelf,
  onEdit,
  onDelete,
}: {
  user: User;
  isSelf: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        className={cn(iconButton, 'text-slate-700 hover:bg-slate-100')}
        aria-label={`Edit user ${user.name}`}
        onClick={() => onEdit(user)}
      >
        <PencilIcon />
      </button>
      {/* You cannot delete your own account (the API refuses too). */}
      {!isSelf && (
        <button
          type="button"
          className={cn(iconButton, 'text-red-700 hover:bg-red-50')}
          aria-label={`Delete user ${user.name}`}
          aria-describedby="delete-help"
          onClick={() => onDelete(user)}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
});
