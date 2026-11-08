/** A metric for the current 30-day period and the 30 days before it. */
export interface Metric {
  value: number;
  previous: number;
}

export interface MetricsSummary {
  users: Metric;
  /** In cents, to avoid floating-point money. */
  revenueCents: Metric;
  orders: Metric;
}

export const TREND_RANGES = [7, 30, 90] as const;
export type TrendRange = (typeof TREND_RANGES)[number];

export interface TrendPoint {
  /** ISO date, YYYY-MM-DD */
  date: string;
  revenueCents: number;
  orders: number;
  newUsers: number;
}

export type ActivityType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.restored'
  | 'order.placed'
  | 'auth.login';

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  actor: string;
  createdAt: string;
}
