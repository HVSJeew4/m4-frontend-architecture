import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { useNotificationStore } from '@/stores/notificationStore';
import { signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

describe('notifications', () => {
  beforeEach(() => {
    signInAs();
    useNotificationStore.setState({ toasts: [] });
  });

  it('shows the unread count in the bell’s accessible name', async () => {
    renderWithProviders(<App />, { route: '/dashboard' });
    expect(await screen.findByRole('button', { name: 'Notifications, 3 unread' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opens the panel, marks all as read, and closes on Escape with focus back on the bell', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/dashboard' });
    const bell = await screen.findByRole('button', { name: 'Notifications, 3 unread' });

    await user.click(bell);
    expect(bell).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('region', { name: 'Notifications' });
    expect(within(panel).getAllByRole('listitem')).toHaveLength(5);

    await user.click(within(panel).getByRole('button', { name: 'Mark all as read' }));
    expect(await screen.findByRole('button', { name: 'Notifications' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveFocus();
  });

  it('marks a single notification as read on the notifications page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/notifications' });

    expect(await screen.findByText('3 unread')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark read: Weekly report ready' }));
    expect(await screen.findByText('2 unread')).toBeInTheDocument();
  });

  it('announces toasts in a live region and lets them be dismissed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { route: '/dashboard' });

    act(() => {
      useNotificationStore.getState().notify({ level: 'success', title: 'Saved' });
    });
    const toast = screen.getByText('Saved');
    expect(toast.closest('[aria-live="polite"]')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('keeps at most four toasts and gives toasts with an action more time', () => {
    const { notify } = useNotificationStore.getState();
    for (let i = 1; i <= 5; i += 1) notify({ level: 'info', title: `T${i}` });
    notify({ level: 'success', title: 'Deleted', action: { label: 'Undo', onClick: () => {} } });

    const { toasts } = useNotificationStore.getState();
    expect(toasts.map((t) => t.title)).toEqual(['T3', 'T4', 'T5', 'Deleted']);
    expect(toasts[0]!.duration).toBe(5_000);
    expect(toasts[3]!.duration).toBe(10_000);
  });
});
