import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarkAllNotificationsRead, useNotifications } from '@/api/notifications';
import { BellIcon } from '@/components/common/icons';
import { NotificationList } from './NotificationList';

const PANEL_ITEMS = 5;

/**
 * Header bell with an unread badge. It is a disclosure (button + panel), not a menu: the panel
 * holds ordinary links and buttons. Escape or a click outside closes it.
 */
export function NotificationBell() {
  const { data } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const unread = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        // The count is part of the name, so it is read even though the badge is visual.
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-md hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        <BellIcon className="h-6 w-6" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs leading-5 font-bold text-white"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Notifications"
          className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-slate-200 bg-surface text-slate-900 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <h2 className="font-semibold">Notifications</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                className="rounded px-2 py-1 text-sm font-medium text-accent hover:bg-blue-50 dark:hover:bg-blue-950 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            <NotificationList items={(data?.items ?? []).slice(0, PANEL_ITEMS)} />
          </div>
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-200 px-4 py-2 text-center text-sm font-medium text-accent hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
