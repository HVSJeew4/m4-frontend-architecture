import { create } from 'zustand';
import type { NotificationLevel } from '@/types/notification';

/** A short-lived message ("User created") – client state, unlike server notifications. */
export interface Toast {
  id: string;
  level: NotificationLevel;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  /** ms before it closes itself; paused while hovered or focused. */
  duration: number;
}

type ToastInput = Omit<Toast, 'id' | 'duration'> & { duration?: number };

interface NotificationState {
  toasts: Toast[];
  notify: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
}

const MAX_TOASTS = 4;
let nextId = 0;

export const useNotificationStore = create<NotificationState>()((set) => ({
  toasts: [],
  notify: (input) => {
    nextId += 1;
    const id = `toast-${nextId}`;
    // A toast with a button (e.g. Undo) stays longer, so there is time to use it (WCAG 2.2.1).
    const duration = input.duration ?? (input.action ? 10_000 : 5_000);
    set((state) => ({ toasts: [...state.toasts, { ...input, id, duration }].slice(-MAX_TOASTS) }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Shorthand for components: `const notify = useNotify(); notify({ ... })`. */
export const useNotify = () => useNotificationStore((state) => state.notify);
