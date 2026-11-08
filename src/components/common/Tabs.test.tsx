import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '@/test/axe';
import { Tabs } from './Tabs';

const TABS = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

function Controlled() {
  const [value, setValue] = useState('month');
  return (
    <Tabs label="Range" tabs={TABS} value={value} onChange={setValue}>
      Showing {value}
    </Tabs>
  );
}

describe('Tabs', () => {
  it('is controlled: the selected tab follows `value` and its panel is labelled by it', () => {
    render(<Controlled />);
    expect(screen.getByRole('tablist', { name: 'Range' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Month' })).toHaveTextContent('Showing month');
  });

  it('has a single Tab stop (roving tabindex)', () => {
    render(<Controlled />);
    expect(screen.getAllByRole('tab').map((t) => t.getAttribute('tabindex'))).toEqual([
      '-1',
      '0',
      '-1',
    ]);
  });

  it('changes with a click', async () => {
    render(<Controlled />);
    await userEvent.click(screen.getByRole('tab', { name: 'Year' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Showing year');
  });

  it('moves with arrow keys (wrapping), Home and End', async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    screen.getByRole('tab', { name: 'Month' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Year' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Year' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Week' })).toHaveFocus();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Controlled />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
