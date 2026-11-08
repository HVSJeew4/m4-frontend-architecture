import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUsers } from '@/api/users';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { PlusIcon } from '@/components/common/icons';
import { LoadingState } from '@/components/common/Skeleton';
import { Tabs } from '@/components/common/Tabs';
import { DeleteUserDialog } from '@/components/features/users/DeleteUserDialog';
import { UserFilters } from '@/components/features/users/UserFilters';
import { UserFormModal } from '@/components/features/users/UserFormModal';
import { DELETE_HELP_ID } from '@/components/features/users/UserRowParts';
import { UsersDirectory } from '@/components/features/users/UsersDirectory';
import { UsersTable } from '@/components/features/users/UsersTable';
import { PAGE_SIZES, useUserListParams } from '@/components/features/users/useUserListParams';
import { PageHeading } from '@/components/layout/PageHeading';
import { useAuthStore } from '@/stores/authStore';
import type { User, UserListParams } from '@/types/user';
import { formatNumber } from '@/utils/format';

type View = 'pages' | 'all';
const VIEW_TABS: { value: View; label: string }[] = [
  { value: 'pages', label: 'Pages' },
  { value: 'all', label: 'All users' },
];

export default function UsersPage() {
  const { params, update, toggleSort } = useUserListParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // URL parameters that are not list filters: ?new=1 opens the create dialog (the dashboard's
  // "Add a user" quick action), ?view=all shows the virtual list.
  const setParam = (key: string, value: string | null) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  const createOpen = searchParams.get('new') === '1';
  const view: View = searchParams.get('view') === 'all' ? 'all' : 'pages';
  const { page, pageSize, ...filters } = params; // the virtual list has no pages

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading ref={headingRef} title="Users" />
        <Button onClick={() => setParam('new', '1')}>
          <PlusIcon />
          Add user
        </Button>
      </div>

      <UserFilters params={params} update={update} />

      {/* The brief's aria-describedby="delete-help": extra context read with every delete button. */}
      <p id={DELETE_HELP_ID} className="sr-only">
        Deleted users are hidden from the list and can be restored with Undo.
      </p>

      <Tabs
        label="View"
        tabs={VIEW_TABS}
        value={view}
        onChange={(next) => setParam('view', next === 'all' ? 'all' : null)}
      >
        {view === 'all' ? (
          <UsersDirectory
            filters={filters}
            currentUserId={currentUserId}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        ) : (
          <PagedUsers
            params={params}
            update={update}
            toggleSort={toggleSort}
            currentUserId={currentUserId}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
        )}
      </Tabs>

      <UserFormModal open={createOpen} onClose={() => setParam('new', null)} />
      {/* key: a fresh form (with the right default values) for each user being edited. */}
      <UserFormModal
        key={editing?.id}
        open={editing !== null}
        user={editing}
        onClose={() => setEditing(null)}
      />
      <DeleteUserDialog
        user={deleting}
        onClose={() => setDeleting(null)}
        afterDeleteFocusRef={headingRef}
      />
    </div>
  );
}

interface PagedUsersProps {
  params: UserListParams;
  update: ReturnType<typeof useUserListParams>['update'];
  toggleSort: (field: string) => void;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

function PagedUsers({
  params,
  update,
  toggleSort,
  currentUserId,
  onEdit,
  onDelete,
}: PagedUsersProps) {
  const { data, isPending, isFetching, isError, error, refetch } = useUsers(params);

  return (
    <div className="flex flex-col gap-3">
      {/* Live region: announces the result count after each search or filter change. */}
      <p role="status" className="min-h-5 text-sm text-slate-700">
        {data && `${formatNumber(data.total)} ${data.total === 1 ? 'user' : 'users'} found`}
      </p>
      {isPending && <LoadingState label="Loading users" />}

      {isError ? (
        <ErrorState title="Could not load users" error={error} onRetry={() => refetch()} />
      ) : (
        <UsersTable
          users={data?.items ?? []}
          currentUserId={currentUserId}
          params={params}
          isLoading={isPending}
          isFetching={isFetching && !isPending}
          onSortChange={toggleSort}
          onEdit={onEdit}
          onDelete={onDelete}
          pagination={
            data && {
              page: data.page,
              totalPages: data.totalPages,
              total: data.total,
              pageSize: data.pageSize,
              onPageChange: (page) => update({ page }),
              pageSizeOptions: PAGE_SIZES,
              onPageSizeChange: (pageSize) => update({ pageSize }),
            }
          }
        />
      )}
    </div>
  );
}
