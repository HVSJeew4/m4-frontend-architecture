const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const integer = new Intl.NumberFormat('en-US');
const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const fullDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export const formatCurrency = (cents: number) => currency.format(cents / 100);
export const formatNumber = (value: number) => integer.format(value);
export const formatShortDate = (iso: string) => shortDate.format(new Date(iso));
export const formatDate = (iso: string) => fullDate.format(new Date(iso));

/** Change between two periods, e.g. +12.5%. Null when there is nothing to compare with. */
export function percentChange(value: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((value - previous) / previous) * 100;
}

export function formatPercent(change: number): string {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return `${sign}${Math.abs(change).toFixed(1)}%`;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** "5 minutes ago", "yesterday", "just now". */
export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}
