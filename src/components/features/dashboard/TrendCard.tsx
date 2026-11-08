import { useState } from 'react';
import { useTrend } from '@/api/dashboard';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState, Skeleton } from '@/components/common/Skeleton';
import { Tabs } from '@/components/common/Tabs';
import { TREND_RANGES, type TrendPoint, type TrendRange } from '@/types/dashboard';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { TrendChart } from './TrendChart';

const RANGE_TABS = TREND_RANGES.map((days) => ({ value: String(days), label: `${days} days` }));

export function TrendCard() {
  const [range, setRange] = useState<TrendRange>(30);
  const { data, isPending, isError, error, refetch } = useTrend(range);

  return (
    <Card aria-labelledby="trend-title">
      <CardHeader titleId="trend-title" title="Revenue and orders" description="Daily totals" />
      <CardBody>
        <Tabs
          label="Time range"
          tabs={RANGE_TABS}
          value={String(range)}
          onChange={(value) => setRange(Number(value) as TrendRange)}
        >
          {isError && (
            <ErrorState title="Could not load the trend" error={error} onRetry={() => refetch()} />
          )}
          {isPending && (
            <>
              <LoadingState label="Loading trend" />
              <Skeleton className="h-72 w-full" />
            </>
          )}
          {data && (
            <>
              <TrendChart data={data} />
              <TrendTable data={data} />
            </>
          )}
        </Tabs>
      </CardBody>
    </Card>
  );
}

/** The chart's data as a table: the text alternative for screen-reader and keyboard users. */
function TrendTable({ data }: { data: TrendPoint[] }) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer rounded text-sm font-medium text-accent focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none">
        Show the chart data as a table
      </summary>
      <div
        className="mt-2 max-h-72 overflow-y-auto"
        role="region"
        aria-label="Trend data"
        tabIndex={0}
      >
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Daily revenue and orders</caption>
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th scope="col" className="px-3 py-2">
                Date
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                Revenue
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                Orders
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((point) => (
              <tr key={point.date}>
                <th scope="row" className="px-3 py-1.5 font-normal">
                  {formatDate(point.date)}
                </th>
                <td className="px-3 py-1.5 text-right">{formatCurrency(point.revenueCents)}</td>
                <td className="px-3 py-1.5 text-right">{formatNumber(point.orders)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
