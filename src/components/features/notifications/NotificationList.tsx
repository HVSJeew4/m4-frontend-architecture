import { useMarkNotificationRead } from '@/api/notifications';
import type { AppNotification, NotificationLevel } from '@/types/notification';
import { cn } from '@/utils/cn';
import { formatRelativeTime } from '@/utils/format';

const DOT: Record<NotificationLevel, string> = {
  info: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-amber-500',
  error: 'bg-red-600',
};

export function NotificationList({ items }: { items: AppNotification[] }) {
  const markRead = useMarkNotificationRead();

  if (items.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-slate-700">You have no notifications.</p>
    );
  }

  return (
    <ul className="divide-y divide-slate-200">
      {items.map((n) => (
        <li
          key={n.id}
          className={cn('flex gap-3 px-4 py-3', !n.read && 'bg-blue-50/60 dark:bg-blue-950/60')}
        >
          <span
            aria-hidden="true"
            className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', DOT[n.level])}
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">
              {/* Read state in text too, not only as a background colour. */}
              {!n.read && <span className="sr-only">Unread: </span>}
              {n.title}
            </p>
            <p className="text-sm text-slate-700">{n.message}</p>
            <p className="mt-1 text-xs text-slate-600">
              <time dateTime={n.createdAt}>{formatRelativeTime(n.createdAt)}</time>
            </p>
          </div>
          {!n.read && (
            <button
              type="button"
              onClick={() => markRead.mutate(n.id)}
              className="h-fit shrink-0 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-blue-100 dark:hover:bg-blue-900 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
            >
              Mark read<span className="sr-only">: {n.title}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
