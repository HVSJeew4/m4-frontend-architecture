import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { mockConfig } from '@/mocks/config';
import { signInAs } from '@/test/auth';
import { axeViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';

describe('dashboard', () => {
  beforeEach(() => {
    signInAs();
  });

  it('shows the three metric cards with change versus the previous period', async () => {
    renderWithProviders(<App />, { route: '/dashboard' });

    expect(await screen.findByText('250')).toBeInTheDocument();
    expect(screen.getByText('Revenue (30 days)')).toBeInTheDocument();
    expect(screen.getByText('Orders (30 days)')).toBeInTheDocument();
    // Direction in text for screen readers, not only colour.
    expect(screen.getAllByText(/^(Up|Down)$/).length).toBeGreaterThanOrEqual(3);
  });

  it('switches the trend range with controlled tabs and offers the data as a table', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/dashboard' });

    const tablist = await screen.findByRole('tablist', { name: 'Time range' });
    expect(within(tablist).getByRole('tab', { name: '30 days' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.click(within(tablist).getByRole('tab', { name: '7 days' }));
    expect(within(tablist).getByRole('tab', { name: '7 days' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    const table = await screen.findByRole('table', { name: 'Daily revenue and orders' });
    expect(within(table).getAllByRole('row')).toHaveLength(8); // header + 7 days
  });

  it('lists recent activity and quick actions', async () => {
    renderWithProviders(<App />, { route: '/dashboard' });

    const activity = await screen.findByRole('region', { name: 'Recent activity' });
    expect(await within(activity).findAllByRole('listitem')).toHaveLength(8);
    expect(screen.getByRole('link', { name: 'Add a user' })).toHaveAttribute(
      'href',
      '/users?new=1',
    );
  });

  it('shows an error with retry when metrics fail, while the rest still loads', async () => {
    mockConfig.fail.add('metrics');
    renderWithProviders(<App />, { route: '/dashboard' });

    expect(await screen.findByText('Could not load metrics')).toBeInTheDocument();
    expect(screen.getByText('Could not load the trend')).toBeInTheDocument();
    const activity = screen.getByRole('region', { name: 'Recent activity' });
    expect(await within(activity).findAllByRole('listitem')).toHaveLength(8);
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<App />, { route: '/dashboard' });
    await screen.findByText('250');
    expect(await axeViolations(container)).toEqual([]);
  });
});
