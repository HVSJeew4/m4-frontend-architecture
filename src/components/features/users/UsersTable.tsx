import { Table, type Column } from '@/components/common/Table';
import type { PaginationProps } from '@/components/common/Pagination';
import type { User, UserListParams } from '@/types/user';
import { formatDate } from '@/utils/format';
import { RowActions, StatusBadge } from './UserRowParts';

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
  );
}
