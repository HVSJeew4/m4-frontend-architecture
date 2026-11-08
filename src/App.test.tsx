import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { axeViolations } from './test/axe';
import { renderWithProviders } from './test/render';

describe('App shell', () => {
  it('redirects / to the dashboard and marks its nav link as current', () => {
    renderWithProviders(<App />, { route: '/' });

    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Users' })).not.toHaveAttribute('aria-current');
  });

  it('has a skip link first in the tab order that targets <main>', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/dashboard' });

    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('navigates between pages from the primary navigation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/dashboard' });

    await user.click(screen.getByRole('link', { name: 'Users' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Users' })).toBeInTheDocument();
  });

  it('toggles the mobile navigation and reports its state with aria-expanded', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/dashboard' });

    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', 'primary-nav');

    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // Following a link closes the menu again.
    await user.click(screen.getByRole('link', { name: 'Users' }));
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('shows a not-found page inside the layout for unknown routes', () => {
    renderWithProviders(<App />, { route: '/nope' });

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<App />, { route: '/dashboard' });
    expect(await axeViolations(container)).toEqual([]);
  });
});
