import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '@/test/axe';
import { VirtualList } from './VirtualList';

const ITEMS = Array.from({ length: 10_000 }, (_, i) => ({
  id: String(i + 1),
  name: `Person ${i + 1}`,
}));

describe('VirtualList (the brief’s API)', () => {
  it('renders only the rows in view, not all 10,000', () => {
    render(
      <VirtualList
        label="People"
        items={ITEMS}
        height={600}
        itemHeight={80}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );
    const rows = within(screen.getByRole('list', { name: 'People' })).getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThan(30); // 600 / 80 = 7.5 visible + a few overscan
    expect(screen.getByText('Person 1')).toBeInTheDocument();
    expect(screen.queryByText('Person 5000')).not.toBeInTheDocument();
  });

  it('tells screen readers the real size and position of each row', () => {
    render(
      <VirtualList
        label="People"
        items={ITEMS}
        height={600}
        itemHeight={80}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );
    const first = screen.getByText('Person 1').closest('li');
    expect(first).toHaveAttribute('aria-setsize', '10000');
    expect(first).toHaveAttribute('aria-posinset', '1');
  });

  it('makes the scroll area reachable by keyboard and gives the full height', () => {
    render(
      <VirtualList
        label="People"
        items={ITEMS}
        height={600}
        itemHeight={80}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );
    const region = screen.getByRole('region', { name: 'People' });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('list', { name: 'People' })).toHaveStyle({ height: '800000px' });
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <VirtualList
        label="People"
        items={ITEMS.slice(0, 50)}
        height={300}
        itemHeight={60}
        getKey={(item) => item.id}
        renderItem={(item) => <span>{item.name}</span>}
      />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
