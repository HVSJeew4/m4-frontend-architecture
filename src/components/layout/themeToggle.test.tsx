import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { useUiStore } from '@/stores/uiStore';
import { signInAs } from '@/test/auth';
import { setSystemPrefersDark } from '@/test/matchMedia';
import { renderWithProviders } from '@/test/render';

describe('dark mode toggle', () => {
  beforeEach(() => {
    signInAs();
    useUiStore.setState({ theme: 'system' });
    setSystemPrefersDark(false);
    document.documentElement.classList.remove('dark');
  });

  it('is a toggle button whose pressed state matches the theme shown', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/dashboard' });

    const toggle = await screen.findByRole('button', { name: 'Dark mode' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement).toHaveClass('dark');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('starts dark when the system prefers dark', async () => {
    setSystemPrefersDark(true);
    renderWithProviders(<App />, { route: '/dashboard' });
    expect(await screen.findByRole('button', { name: 'Dark mode' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(document.documentElement).toHaveClass('dark');
  });

  it('is also on the login page', async () => {
    useUiStore.setState({ theme: 'light' });
    renderWithProviders(<App />, { route: '/login' });
    expect(await screen.findByRole('button', { name: 'Dark mode' })).toBeInTheDocument();
  });
});
