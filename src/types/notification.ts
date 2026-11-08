export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

/** Named AppNotification so it does not clash with the browser's global `Notification`. */
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  level: NotificationLevel;
  read: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}
