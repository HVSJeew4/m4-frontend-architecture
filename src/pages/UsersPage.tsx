import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUsers } from '@/api/users';
import { Button } from '@/components/common/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { PlusIcon } from '@/components/common/icons';
import { LoadingState } from '@/components/common/Skeleton';
import { DeleteUserDialog } from '@/components/features/users/DeleteUserDialog';
import { UserFilters } from '@/components/features/users/UserFilters';
import { UserFormModal } from '@/components/features/users/UserFormModal';
import { UsersTable } from '@/components/features/users/UsersTable';
import { PAGE_SIZES, useUserListParams } from '@/components/features/users/useUserListParams';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types/user';
import { formatNumber } from '@/utils/format';

export default function UsersPage() {
  const { params, update, toggleSort } = useUserListParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isPending, isFetching, isError, error, refetch } = useUsers(params);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // ?new=1 opens the create dialog (used by the dashboard's "Add a user" quick action).
  const createOpen = searchParams.get('new') === '1';
  const setCreateOpen = (open: boolean) =>
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (open) next.set('new', '1');
      else next.delete('new');
      return next;
    });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold text-slate-900 focus:outline-none"
        >
          Users
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon />
          Add user
        </Button>
      </div>

      <UserFilters params={params} update={update} />

      {/* Live region: announces the result count after each search or filter change. */}
      <p role="status" className="text-sm text-slate-700">
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
          onEdit={setEditing}
          onDelete={setDeleting}
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

      <UserFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
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
