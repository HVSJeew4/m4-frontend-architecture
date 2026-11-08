import { useQuery } from '@tanstack/react-query';
import type { Activity, MetricsSummary, TrendPoint, TrendRange } from '@/types/dashboard';
import { apiFetch } from './client';

export const dashboardKeys = {
  summary: ['metrics', 'summary'] as const,
  trend: (days: TrendRange) => ['metrics', 'trend', days] as const,
  activity: (limit: number) => ['activity', limit] as const,
};

export function useMetricsSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: ({ signal }) => apiFetch<MetricsSummary>('/api/metrics/summary', { signal }),
  });
}

export function useTrend(days: TrendRange) {
  return useQuery({
    queryKey: dashboardKeys.trend(days),
    queryFn: ({ signal }) => apiFetch<TrendPoint[]>(`/api/metrics/trend?days=${days}`, { signal }),
  });
}

export function useActivity(limit = 8) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: ({ signal }) => apiFetch<Activity[]>(`/api/activity?limit=${limit}`, { signal }),
  });
}
