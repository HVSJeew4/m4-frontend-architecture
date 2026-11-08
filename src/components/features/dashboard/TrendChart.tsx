import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatShortDate } from '@/utils/format';

// Loaded with React.lazy (see TrendCard), so Recharts is only downloaded when the dashboard
// shows a chart – it never weighs on the login page.
export default function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tick={{ fill: '#475569', fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            yAxisId="revenue"
            tickFormatter={(cents: number) => formatCurrency(cents)}
            tick={{ fill: '#475569', fontSize: 12 }}
            width={72}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tickFormatter={formatNumber}
            tick={{ fill: '#475569', fontSize: 12 }}
            width={40}
          />
          <Tooltip
            labelFormatter={(label) => formatShortDate(String(label))}
            formatter={(value, name) =>
              name === 'Revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value))
            }
          />
          <Legend />
          {/* Different colour AND dash pattern, so the lines differ without relying on colour. */}
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenueCents"
            name="Revenue"
            stroke="#1d4ed8"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            name="Orders"
            stroke="#b45309"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
