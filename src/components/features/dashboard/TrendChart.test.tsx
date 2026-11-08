import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TrendPoint } from '@/types/dashboard';
import { niceCeil } from '@/utils/niceCeil';
import { TrendChart } from './TrendChart';

const DATA: TrendPoint[] = [
  { date: '2026-11-01', revenueCents: 120_000, orders: 30, newUsers: 2 },
  { date: '2026-11-02', revenueCents: 180_000, orders: 45, newUsers: 4 },
  { date: '2026-11-03', revenueCents: 150_000, orders: 38, newUsers: 1 },
];

describe('TrendChart', () => {
  it('is an image with a text summary of both series', () => {
    render(<TrendChart data={DATA} />);
    const chart = screen.getByRole('img');
    expect(chart).toHaveAccessibleName(
      /from Nov 1 to Nov 3\. Revenue went from \$1,200 to \$1,500, orders from 30 to 38/,
    );
  });

  it('draws one solid and one dashed line, and names them in a text legend', () => {
    const { container } = render(<TrendChart data={DATA} />);
    const paths = container.querySelectorAll('svg[role="img"] path');
    expect(paths).toHaveLength(2);
    expect(paths[0]).not.toHaveAttribute('stroke-dasharray');
    expect(paths[1]).toHaveAttribute('stroke-dasharray', '6 4');
    expect(screen.getByText('Revenue (left axis)')).toBeInTheDocument();
    expect(screen.getByText('Orders (right axis)')).toBeInTheDocument();
  });

  it('labels the axes with round numbers', () => {
    render(<TrendChart data={DATA} />);
    // max revenue $1,800 → axis to $2,000; max orders 45 → axis to 50
    expect(screen.getByText('$2,000')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});

describe('niceCeil', () => {
  it.each([
    [0, 1],
    [7, 10],
    [45, 50],
    [180_000, 200_000],
    [230, 250],
    [1_000, 1_000],
  ])('%d → %d', (value, expected) => {
    expect(niceCeil(value)).toBe(expected);
  });
});
