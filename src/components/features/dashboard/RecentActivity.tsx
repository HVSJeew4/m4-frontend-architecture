import { useActivity } from '@/api/dashboard';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState, Skeleton } from '@/components/common/Skeleton';
import { formatRelativeTime } from '@/utils/format';

export function RecentActivity() {
  const { data, isPending, isError, error, refetch } = useActivity(8);

  return (
    <Card aria-labelledby="activity-title">
      <CardHeader titleId="activity-title" title="Recent activity" />
      <CardBody className="p-0 sm:p-0">
        {isError && (
          <div className="p-4">
            <ErrorState title="Could not load activity" error={error} onRetry={() => refetch()} />
          </div>
        )}
        {isPending && (
          <div className="space-y-3 p-4">
            <LoadingState label="Loading activity" />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}
        {data && data.length === 0 && (
          <p className="p-4 text-sm text-slate-700">No activity yet.</p>
        )}
        {data && data.length > 0 && (
          <ol className="divide-y divide-slate-200">
            {data.map((item) => (
              <li key={item.id} className="px-4 py-3 text-sm sm:px-5">
                <p className="text-slate-900">
                  <span className="font-medium">{item.actor}</span> {item.message}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  <time dateTime={item.createdAt}>{formatRelativeTime(item.createdAt)}</time>
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
