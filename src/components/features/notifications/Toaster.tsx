import { useEffect, useState } from 'react';
import { Alert } from '@/components/common/Alert';
import { useNotificationStore, type Toast } from '@/stores/notificationStore';

/**
 * Renders toasts in a live region. The region is always in the page (even when empty), because
 * screen readers only announce changes to a live region that already exists.
 */
export function Toaster() {
  const toasts = useNotificationStore((state) => state.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useNotificationStore((state) => state.dismiss);
  const [paused, setPaused] = useState(false);

  // Closes itself after `duration`, but not while the pointer or keyboard focus is on it.
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [paused, toast.id, toast.duration, dismiss]);

  return (
    // Hover/focus only pause the timer – there is no action here to make keyboard-operable, and
    // keyboard users get the same pause because focusing a button inside fires onFocus.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="pointer-events-auto w-full max-w-sm shadow-lg"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Alert variant={toast.level} title={toast.title} onDismiss={() => dismiss(toast.id)}>
        {toast.message && <p>{toast.message}</p>}
        {toast.action && (
          <button
            type="button"
            className="mt-2 font-semibold underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
            onClick={() => {
              toast.action?.onClick();
              dismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
      </Alert>
    </div>
  );
}
