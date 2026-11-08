import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { server } from '@/mocks/node';
import { signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

/** Bodies of the write requests the app sent to /api/users. */
function recordUserWrites() {
  const writes: { method: string; body: unknown }[] = [];
  server.events.on('request:start', async ({ request }) => {
    if (request.method !== 'GET' && new URL(request.url).pathname.startsWith('/api/users')) {
      writes.push({
        method: request.method,
        body: await request
          .clone()
          .json()
          .catch(() => null),
      });
    }
  });
  return writes;
}

async function openCreate() {
  const user = userEvent.setup();
  renderWithProviders(<App />, { route: '/users' });
  await screen.findByText(/users? found/);
  await user.click(screen.getByRole('button', { name: 'Add user' }));
  return { user, dialog: screen.getByRole('dialog', { name: 'Add user' }) };
}

async function openEdit(name = 'Eden Editor') {
  const user = userEvent.setup();
  renderWithProviders(<App />, { route: '/users?search=eden' });
  await user.click(await screen.findByRole('button', { name: `Edit user ${name}` }));
  return { user, dialog: screen.getByRole('dialog', { name: `Edit ${name}` }) };
}

describe('user form – validation and server errors', () => {
  beforeEach(() => {
    signInAs();
  });
  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('moves focus to the first invalid field on submit', async () => {
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByLabelText(/Email/), 'bad');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

    expect(
      await within(dialog).findByText('Name must be at least 2 characters'),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Name/)).toHaveFocus();
  });

  it('shows a duplicate email (409) under the Email field, focused, instead of a general alert', async () => {
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByLabelText(/Name/), 'Copy Cat');
    await user.type(within(dialog).getByLabelText(/Email/), 'editor@adminflow.test');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

    const email = within(dialog).getByLabelText(/Email/);
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(email).toHaveAccessibleDescription('A user with this email already exists');
    expect(email).toHaveFocus();
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    // The rest of the form is kept, so the admin only fixes the email.
    expect(within(dialog).getByLabelText(/Name/)).toHaveValue('Copy Cat');
  });

  it('sends a trimmed, lower-cased email', async () => {
    const writes = recordUserWrites();
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByLabelText(/Name/), 'Mixed Case');
    await user.type(within(dialog).getByLabelText(/Email/), '  Mixed.Case@Example.COM ');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

    expect(await screen.findByText('User created')).toBeInTheDocument();
    expect(writes).toEqual([
      { method: 'POST', body: expect.objectContaining({ email: 'mixed.case@example.com' }) },
    ]);
  });
});

describe('user form – edit sends only what changed', () => {
  beforeEach(() => {
    signInAs();
  });
  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('sends only the changed field in the PATCH', async () => {
    const writes = recordUserWrites();
    const { user, dialog } = await openEdit();
    await user.selectOptions(within(dialog).getByLabelText(/Role/), 'admin');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Changes saved')).toBeInTheDocument();
    expect(writes).toEqual([{ method: 'PATCH', body: { role: 'admin' } }]);
  });

  it('closes without a request (and without "Changes saved") when nothing changed', async () => {
    const writes = recordUserWrites();
    const { user, dialog } = await openEdit();
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(writes).toEqual([]);
    expect(screen.queryByText('Changes saved')).not.toBeInTheDocument();
  });
});

describe('user form – unsaved-change guard', () => {
  beforeEach(() => {
    signInAs();
  });

  it('closes an untouched form straight away', async () => {
    const { user, dialog } = await openCreate();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before discarding changes; "Keep editing" goes back with the input intact', async () => {
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByLabelText(/Name/), 'Half typed');
    await user.keyboard('{Escape}');

    const confirm = screen.getByRole('dialog', { name: 'Discard changes?' });
    expect(within(confirm).getByRole('button', { name: 'Keep editing' })).toHaveFocus();
    await user.click(within(confirm).getByRole('button', { name: 'Keep editing' }));

    expect(screen.queryByRole('dialog', { name: 'Discard changes?' })).not.toBeInTheDocument();
    expect(within(dialog).getByLabelText(/Name/)).toHaveValue('Half typed');
  });

  it('discards and closes both dialogs when confirmed (Cancel button too)', async () => {
    const { user, dialog } = await openCreate();
    await user.type(within(dialog).getByLabelText(/Name/), 'Throw away');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await user.click(
      within(screen.getByRole('dialog', { name: 'Discard changes?' })).getByRole('button', {
        name: 'Discard',
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Opening again starts empty.
    await user.click(screen.getByRole('button', { name: 'Add user' }));
    expect(
      within(screen.getByRole('dialog', { name: 'Add user' })).getByLabelText(/Name/),
    ).toHaveValue('');
  });

  it('guards the edit form too', async () => {
    const { user, dialog } = await openEdit();
    await user.type(within(dialog).getByLabelText(/Name/), ' Jr');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Discard changes?' })).toBeInTheDocument();
  });
});
