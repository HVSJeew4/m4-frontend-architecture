import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { useAuthStore } from '@/stores/authStore';
import { signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

describe('authentication flow', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isLoading: false, error: null });
  });

  it('sends a signed-out visitor to /login, then back to the page they asked for', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/users?role=editor' });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in to AdminFlow' }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/email/i), 'admin@adminflow.test');
    await user.type(screen.getByLabelText(/password/i), 'long-enough');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Users' })).toBeInTheDocument();
  });

  it('shows the server error for an account without admin access', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'user@adminflow.test');
    await user.type(screen.getByLabelText(/password/i), 'long-enough');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account does not have admin access',
    );
  });

  it('validates the form before calling the API', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('lets a signed-in admin straight through, and /login sends them to the dashboard', () => {
    signInAs();
    renderWithProviders(<App />, { route: '/login' });
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('signs out from the header, returns to /login and empties the query cache', async () => {
    const user = userEvent.setup();
    signInAs();
    const { queryClient } = renderWithProviders(<App />, { route: '/dashboard' });
    await screen.findByText('Avery Admin');

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Sign in to AdminFlow' }),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
