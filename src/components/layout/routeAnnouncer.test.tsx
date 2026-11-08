import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

describe('route changes', () => {
  beforeEach(() => {
    signInAs();
  });

  it('sets a page title for each route', async () => {
    renderWithProviders(<App />, { route: '/dashboard' });
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    expect(document.title).toBe('Dashboard · AdminFlow');
  });

  it('does not move focus on the first page load (screen readers start at the top)', async () => {
    renderWithProviders(<App />, { route: '/dashboard' });
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
    expect(document.body).toHaveFocus();
  });

  it('after navigating, updates the title and moves focus to the new page heading', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/dashboard' });
    await screen.findByRole('heading', { level: 1, name: 'Dashboard' });

    await user.click(screen.getByRole('link', { name: 'Users' }));
    const heading = await screen.findByRole('heading', { level: 1, name: 'Users' });
    expect(document.title).toBe('Users · AdminFlow');
    expect(heading).toHaveFocus();
  });

  it('titles the login and not-found pages too', async () => {
    renderWithProviders(<App />, { route: '/nope' });
    await screen.findByRole('heading', { level: 1, name: 'Page not found' });
    expect(document.title).toBe('Page not found · AdminFlow');
  });
});
