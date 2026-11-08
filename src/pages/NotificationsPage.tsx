import { useMarkAllNotificationsRead, useNotifications } from '@/api/notifications';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState, Skeleton } from '@/components/common/Skeleton';
import { NotificationList } from '@/components/features/notifications/NotificationList';

export default function NotificationsPage() {
  const { data, isPending, isError, error, refetch } = useNotifications();
  const markAll = useMarkAllNotificationsRead();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {data && (
            <p className="mt-1 text-slate-700">
              {data.unreadCount === 0 ? 'All caught up.' : `${data.unreadCount} unread`}
            </p>
          )}
        </div>
        {data && data.unreadCount > 0 && (
          <Button
            variant="secondary"
            onClick={() => markAll.mutate()}
            isLoading={markAll.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {isError && (
        <ErrorState title="Could not load notifications" error={error} onRetry={() => refetch()} />
      )}
      {isPending && (
        <div className="space-y-3">
          <LoadingState label="Loading notifications" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
      {data && (
        <Card aria-label="All notifications">
          <NotificationList items={data.items} />
        </Card>
      )}
    </div>
  );
}
