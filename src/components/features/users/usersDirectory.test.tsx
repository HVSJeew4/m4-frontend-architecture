import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

describe('users page – "All users" virtual list', () => {
  beforeEach(() => {
    signInAs();
  });

  it('switches between the paged table and a virtualised list of every user', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/users' });
    await screen.findByText('250 users found');

    const views = screen.getByRole('tablist', { name: 'View' });
    expect(within(views).getByRole('tab', { name: 'Pages' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(within(views).getByRole('tab', { name: 'All users' }));

    const list = await screen.findByRole('list', { name: 'All users' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.length).toBeLessThan(40); // only what is in view
    expect(rows[0]).toHaveAttribute('aria-setsize', '250');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('keeps the view in the URL and still applies filters', async () => {
    renderWithProviders(<App />, { route: '/users?view=all&role=editor' });
    const list = await screen.findByRole('list', { name: 'All users' });
    const first = within(list).getAllByRole('listitem')[0]!;
    expect(first).toHaveTextContent(/editor/i);
  });
});
