import { useMetricsSummary } from '@/api/dashboard';
import { ErrorState } from '@/components/common/ErrorState';
import { ArrowDownIcon, ArrowUpIcon } from '@/components/common/icons';
import { LoadingState, Skeleton } from '@/components/common/Skeleton';
import type { Metric } from '@/types/dashboard';
import { cn } from '@/utils/cn';
import { formatCurrency, formatNumber, formatPercent, percentChange } from '@/utils/format';

export function MetricCards() {
  const { data, isPending, isError, error, refetch } = useMetricsSummary();

  if (isError)
    return <ErrorState title="Could not load metrics" error={error} onRetry={() => refetch()} />;

  const cards = data
    ? [
        { label: 'Users', metric: data.users, format: formatNumber, period: 'vs. 30 days ago' },
        {
          label: 'Revenue (30 days)',
          metric: data.revenueCents,
          format: formatCurrency,
          period: 'vs. previous 30 days',
        },
        {
          label: 'Orders (30 days)',
          metric: data.orders,
          format: formatNumber,
          period: 'vs. previous 30 days',
        },
      ]
    : [];

  return (
    <>
      {isPending && <LoadingState label="Loading metrics" />}
      {/* A list of cards: screen readers announce "list, 3 items". */}
      <ul className="grid gap-4 sm:grid-cols-3" aria-busy={isPending || undefined}>
        {isPending &&
          [0, 1, 2].map((i) => (
            <li key={i} className="rounded-lg border border-slate-200 bg-surface p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-3 h-4 w-40" />
            </li>
          ))}
        {cards.map(({ label, metric, format, period }) => (
          <li key={label} className="rounded-lg border border-slate-200 bg-surface p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {format(metric.value)}
            </p>
            <Change metric={metric} period={period} />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Up/down is shown with an arrow and a sign, not only with green/red. */
function Change({ metric, period }: { metric: Metric; period: string }) {
  const change = percentChange(metric.value, metric.previous);
  if (change === null) return <p className="mt-2 text-sm text-slate-600">No earlier data</p>;
  const up = change >= 0;
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <p
      className={cn(
        'mt-2 flex items-center gap-1 text-sm font-medium',
        up ? 'text-success' : 'text-danger',
      )}
    >
      <Arrow className="h-4 w-4" />
      <span>
        <span className="sr-only">{up ? 'Up' : 'Down'} </span>
        {formatPercent(change)}
      </span>
      <span className="font-normal text-slate-600">{period}</span>
    </p>
  );
}
