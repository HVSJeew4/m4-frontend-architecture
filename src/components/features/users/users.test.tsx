import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { mockConfig } from '@/mocks/config';
import { getDb } from '@/mocks/db';
import { server } from '@/mocks/node';
import { signInAs } from '@/test/auth';
import { axeViolations } from '@/test/axe';
import { renderWithProviders } from '@/test/render';

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1); // minus header
const firstCellTexts = () => rows().map((row) => within(row).getAllByRole('cell')[0]!.textContent);

async function renderUsers(route = '/users') {
  const result = renderWithProviders(<App />, { route });
  await screen.findByText(/users? found/);
  return result;
}

describe('users page', () => {
  beforeEach(() => {
    signInAs();
  });

  it('lists the first page and announces the total', async () => {
    await renderUsers();
    // In a live region (role="status"), so screen readers hear the new count after each change.
    expect(screen.getByText('250 users found')).toHaveAttribute('role', 'status');
    expect(rows()).toHaveLength(10);
    expect(screen.getByText('Showing 1–10 of 250')).toBeInTheDocument();
  });

  it('pages forward and back', async () => {
    const user = userEvent.setup();
    await renderUsers();
    const firstPage = firstCellTexts();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Showing 11–20 of 250')).toBeInTheDocument();
    expect(firstCellTexts()).not.toEqual(firstPage);

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(await screen.findByText('Showing 1–10 of 250')).toBeInTheDocument();
  });

  it('sorts by a column and reports it with aria-sort', async () => {
    const user = userEvent.setup();
    await renderUsers();

    await user.click(screen.getByRole('button', { name: /^Name/ }));
    const header = screen.getByRole('columnheader', { name: /Name/ });
    await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'ascending'));
    await waitFor(() => {
      const names = firstCellTexts();
      expect(names).toEqual([...names].sort((a, b) => a!.localeCompare(b!)));
    });

    await user.click(screen.getByRole('button', { name: /^Name/ }));
    await waitFor(() => expect(header).toHaveAttribute('aria-sort', 'descending'));
  });

  it('filters by role', async () => {
    const user = userEvent.setup();
    await renderUsers();

    await user.selectOptions(screen.getByLabelText('Role'), 'editor');
    const editors = getDb().users.filter((u) => u.role === 'editor').length;
    expect(await screen.findByText(`${editors} users found`)).toBeInTheDocument();
    for (const row of rows()) expect(row).toHaveTextContent(/editor/i);
  });

  it('searches 300 ms after typing stops, not on every key', async () => {
    const user = userEvent.setup();
    const searches: string[] = [];
    server.events.on('request:start', ({ request }) => {
      const search = new URL(request.url).searchParams.get('search');
      if (search) searches.push(search);
    });
    await renderUsers();

    await user.type(screen.getByLabelText('Search by name or email'), 'eden ed');
    expect(await screen.findByText('1 user found')).toBeInTheDocument();
    expect(screen.getByText('Eden Editor')).toBeInTheDocument();
    // One request for the whole word, not one per character.
    expect(searches).toEqual(['eden ed']);
    server.events.removeAllListeners();
  });

  it('shows an empty state when nothing matches', async () => {
    await renderUsers('/users?search=zzzz-nobody');
    expect(screen.getByText('No users match these filters.')).toBeInTheDocument();
    expect(screen.getByText('0 users found')).toBeInTheDocument();
  });

  it('creates a user: validation first, then a success toast', async () => {
    const user = userEvent.setup();
    await renderUsers();

    await user.click(screen.getByRole('button', { name: 'Add user' }));
    const dialog = screen.getByRole('dialog', { name: 'Add user' });
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));
    expect(
      await within(dialog).findByText('Name must be at least 2 characters'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Invalid email address')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/Name/), 'Nadia Perera');
    await user.type(within(dialog).getByLabelText(/Email/), 'nadia@example.com');
    await user.selectOptions(within(dialog).getByLabelText(/Role/), 'editor');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

    expect(await screen.findByText('User created')).toBeInTheDocument();
    // Closing changes the URL (?new=1 removed), which React Router runs as a transition.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('251 users found')).toBeInTheDocument();
  });

  it('shows a server error that is not about one field as an alert in the dialog', async () => {
    const user = userEvent.setup();
    await renderUsers();
    mockConfig.fail.add('users'); // the next request (the POST) answers 500

    await user.click(screen.getByRole('button', { name: 'Add user' }));
    const dialog = screen.getByRole('dialog', { name: 'Add user' });
    await user.type(within(dialog).getByLabelText(/Name/), 'Nadia Perera');
    await user.type(within(dialog).getByLabelText(/Email/), 'nadia@example.com');
    await user.click(within(dialog).getByRole('button', { name: 'Create user' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Simulated server error');
    expect(within(dialog).getByLabelText(/Name/)).toHaveValue('Nadia Perera');
  });

  it('edits optimistically: the row changes before the server answers', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch('/api/users/:id', async () => {
        await delay(200);
        return HttpResponse.json({ ...getDb().users[1], name: 'Eden Renamed' });
      }),
    );
    await renderUsers('/users?search=eden');

    await user.click(screen.getByRole('button', { name: 'Edit user Eden Editor' }));
    const nameField = within(screen.getByRole('dialog')).getByLabelText(/Name/);
    expect(nameField).toHaveValue('Eden Editor'); // pre-filled
    await user.clear(nameField);
    await user.type(nameField, 'Eden Renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    // Immediately, while the PATCH is still waiting 200 ms:
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Eden Renamed')).toBeInTheDocument();
    expect(await screen.findByText('Changes saved')).toBeInTheDocument();
  });

  it('rolls the row back and explains why when the update fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch('/api/users/:id', async () => {
        await delay(100);
        return HttpResponse.json({ message: 'Database is read-only' }, { status: 503 });
      }),
    );
    await renderUsers('/users?search=eden');

    await user.click(screen.getByRole('button', { name: 'Edit user Eden Editor' }));
    const nameField = within(screen.getByRole('dialog')).getByLabelText(/Name/);
    await user.clear(nameField);
    await user.type(nameField, 'Never Saved');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Never Saved')).toBeInTheDocument();
    expect(await screen.findByText('Could not update Eden Editor')).toBeInTheDocument();
    expect(screen.getByText('Database is read-only')).toBeInTheDocument();
    expect(screen.queryByText('Never Saved')).not.toBeInTheDocument();
    expect(screen.getByText('Eden Editor')).toBeInTheDocument();
  });

  it('deletes after confirmation (soft delete) and restores with Undo', async () => {
    const user = userEvent.setup();
    await renderUsers('/users?search=eden');

    const deleteButton = screen.getByRole('button', { name: 'Delete user Eden Editor' });
    expect(deleteButton).toHaveAccessibleDescription(/can be restored with Undo/);
    await user.click(deleteButton);

    const dialog = screen.getByRole('dialog', { name: 'Delete user?' });
    expect(dialog).toHaveAccessibleDescription(/Eden Editor will be removed/);
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Delete user' }));
    expect(await screen.findByText('User deleted')).toBeInTheDocument();
    expect(await screen.findByText('0 users found')).toBeInTheDocument();
    expect(getDb().users.find((u) => u.id === 'u2')?.deletedAt).not.toBeNull(); // still stored
    expect(screen.getByRole('heading', { level: 1, name: 'Users' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByText('User restored')).toBeInTheDocument();
    expect(await screen.findByText('1 user found')).toBeInTheDocument();
  });

  it('does not offer to delete your own account', async () => {
    await renderUsers('/users?search=avery');
    expect(screen.getByRole('button', { name: 'Edit user Avery Admin' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete user Avery Admin' }),
    ).not.toBeInTheDocument();
  });

  it('opens the create dialog from ?new=1 (dashboard quick action)', async () => {
    await renderUsers('/users?new=1');
    expect(screen.getByRole('dialog', { name: 'Add user' })).toBeInTheDocument();
  });

  it('shows an error with a retry button when the list fails to load', async () => {
    const user = userEvent.setup();
    let fail = true;
    server.use(
      http.get('/api/users', () =>
        fail ? HttpResponse.json({ message: 'Server unavailable' }, { status: 500 }) : undefined,
      ),
    );
    renderWithProviders(<App />, { route: '/users' });

    expect(await screen.findByText('Could not load users')).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('250 users found')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = await renderUsers();
    expect(await axeViolations(container)).toEqual([]);
  });
});
