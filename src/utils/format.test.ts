import { describe, expect, it } from 'vitest';
import { formatCurrency, formatPercent, formatRelativeTime, percentChange } from './format';

describe('format utilities', () => {
  it('formats cents as whole dollars', () => {
    expect(formatCurrency(1_234_567)).toBe('$12,346');
  });

  it('computes and formats percentage change, with a real minus sign', () => {
    expect(percentChange(110, 100)).toBeCloseTo(10);
    expect(percentChange(5, 0)).toBeNull();
    expect(formatPercent(12.345)).toBe('+12.3%');
    expect(formatPercent(-4)).toBe('−4.0%');
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formats relative times', () => {
    const now = Date.parse('2026-11-08T12:00:00Z');
    expect(formatRelativeTime('2026-11-08T11:59:30Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-11-08T11:55:00Z', now)).toBe('5 minutes ago');
    expect(formatRelativeTime('2026-11-08T09:00:00Z', now)).toBe('3 hours ago');
    expect(formatRelativeTime('2026-11-07T12:00:00Z', now)).toBe('yesterday');
  });
});
