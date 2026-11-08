import { useElementWidth } from '@/hooks/useElementWidth';
import { useResolvedTheme } from '@/hooks/useTheme';
import type { TrendPoint } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatShortDate } from '@/utils/format';
import { niceCeil } from '@/utils/niceCeil';

// A small hand-written SVG line chart. It replaced Recharts after measuring: on a mobile
// Lighthouse run Recharts cost ~10 performance points (dashboard median 86 → 96 without it,
// Total Blocking Time 560 → 220 ms) and ~109 KB gzipped. Exact values are in the data table next
// to the chart (TrendCard), which is also the text alternative – so no hover tooltip is needed.

const HEIGHT = 260;
const PADDING = { top: 12, right: 48, bottom: 28, left: 72 };
const Y_STEPS = [0, 0.25, 0.5, 0.75, 1];

// Lines are at least 3:1 against the card (WCAG 1.4.11) and axis text at least 4.5:1, per theme.
const PALETTES = {
  light: { revenue: '#1d4ed8', orders: '#b45309', text: '#475569', grid: '#e2e8f0' },
  dark: { revenue: '#60a5fa', orders: '#fbbf24', text: '#cbd5e1', grid: '#334155' },
};

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>(640);
  const colors = PALETTES[useResolvedTheme()];

  const innerWidth = Math.max(0, width - PADDING.left - PADDING.right);
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const maxRevenue = niceCeil(Math.max(...data.map((d) => d.revenueCents)));
  const maxOrders = niceCeil(Math.max(...data.map((d) => d.orders)));

  const x = (index: number) =>
    PADDING.left + (data.length < 2 ? innerWidth / 2 : (index * innerWidth) / (data.length - 1));
  const y = (value: number, max: number) => PADDING.top + innerHeight - (value / max) * innerHeight;
  const line = (values: number[], max: number) =>
    values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v, max).toFixed(1)}`).join(' ');

  // About one date label per 80 px, so labels never overlap.
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(innerWidth / 80))));
  const first = data[0];
  const last = data[data.length - 1];
  const summary =
    first && last
      ? `Line chart of daily revenue and orders from ${formatShortDate(first.date)} to ${formatShortDate(last.date)}. ` +
        `Revenue went from ${formatCurrency(first.revenueCents)} to ${formatCurrency(last.revenueCents)}, ` +
        `orders from ${formatNumber(first.orders)} to ${formatNumber(last.orders)}. Exact values are in the table below.`
      : 'No data for this period.';

  return (
    <div ref={ref} className="w-full min-w-0">
      {/* viewBox + max-w-full: before the first measurement (fallback width) the chart scales
          down instead of overflowing. */}
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={summary}
        className="block h-auto max-w-full"
      >
        {/* Grid and y-axis labels: revenue on the left, orders on the right. */}
        {Y_STEPS.map((step) => {
          const gridY = PADDING.top + innerHeight - step * innerHeight;
          return (
            <g key={step}>
              <line
                x1={PADDING.left}
                x2={PADDING.left + innerWidth}
                y1={gridY}
                y2={gridY}
                stroke={colors.grid}
              />
              <text
                x={PADDING.left - 8}
                y={gridY}
                dy="0.32em"
                textAnchor="end"
                fontSize={12}
                fill={colors.text}
              >
                {formatCurrency(step * maxRevenue)}
              </text>
              <text
                x={PADDING.left + innerWidth + 8}
                y={gridY}
                dy="0.32em"
                fontSize={12}
                fill={colors.text}
              >
                {formatNumber(step * maxOrders)}
              </text>
            </g>
          );
        })}
        {data.map((point, index) =>
          index % labelEvery === 0 ? (
            <text
              key={point.date}
              x={x(index)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={12}
              fill={colors.text}
            >
              {formatShortDate(point.date)}
            </text>
          ) : null,
        )}
        {/* Different colour AND line style, so the two series differ without relying on colour. */}
        <path
          d={line(
            data.map((d) => d.revenueCents),
            maxRevenue,
          )}
          fill="none"
          stroke={colors.revenue}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path
          d={line(
            data.map((d) => d.orders),
            maxOrders,
          )}
          fill="none"
          stroke={colors.orders}
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeLinejoin="round"
        />
      </svg>
      {/* Legend as real text, not inside the SVG image. */}
      <ul className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-slate-700">
        <li className="flex items-center gap-2">
          <svg aria-hidden="true" width="24" height="8">
            <line x1="0" x2="24" y1="4" y2="4" stroke={colors.revenue} strokeWidth={2} />
          </svg>
          Revenue (left axis)
        </li>
        <li className="flex items-center gap-2">
          <svg aria-hidden="true" width="24" height="8">
            <line
              x1="0"
              x2="24"
              y1="4"
              y2="4"
              stroke={colors.orders}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          </svg>
          Orders (right axis)
        </li>
      </ul>
    </div>
  );
}
