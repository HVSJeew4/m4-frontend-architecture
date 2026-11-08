import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '@/test/axe';
import { Modal } from './Modal';

function Harness({ withInitialFocus = false }: { withInitialFocus?: boolean }) {
  const [open, setOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Delete John Doe
      </button>
      <a href="#elsewhere">Outside link</a>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm Delete"
        description="Are you sure?"
        initialFocusRef={withInitialFocus ? cancelRef : undefined}
        footer={
          <>
            <button type="button" ref={cancelRef} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="button">Delete</button>
          </>
        }
      />
    </div>
  );
}

async function openModal(props?: { withInitialFocus?: boolean }) {
  const user = userEvent.setup();
  const result = render(<Harness {...props} />);
  await user.click(screen.getByRole('button', { name: 'Delete John Doe' }));
  return { user, ...result };
}

describe('Modal', () => {
  it('is a modal dialog named by its title and described by its description', async () => {
    await openModal();
    const dialog = screen.getByRole('dialog', { name: 'Confirm Delete' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription('Are you sure?');
  });

  it('moves focus into the dialog (first focusable, or the given element)', async () => {
    await openModal();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('focuses initialFocusRef when given', async () => {
    await openModal({ withInitialFocus: true });
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('traps focus: Tab from the last element goes to the first, Shift+Tab goes back', async () => {
    const { user } = await openModal();
    const close = screen.getByRole('button', { name: 'Close dialog' });
    const last = screen.getByRole('button', { name: 'Delete' });

    await user.tab(); // Cancel
    await user.tab(); // Delete
    expect(last).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(last).toHaveFocus();
  });

  it('makes the rest of the page inert while open', async () => {
    const { container } = await openModal();
    expect(container).toHaveAttribute('inert');
  });

  it('closes on Escape and returns focus to the button that opened it', async () => {
    const { user, container } = await openModal();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(container).not.toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Delete John Doe' })).toHaveFocus();
  });

  it('closes with the close button', async () => {
    const { user } = await openModal();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    await openModal();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
