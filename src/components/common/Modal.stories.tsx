import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Input } from './Input';
import { Modal, type ModalProps } from './Modal';

// The modal is controlled, so each story renders a trigger button and keeps `open` in state.
function ModalDemo(props: Omit<ModalProps, 'open' | 'onClose'> & { triggerLabel: string }) {
  const { triggerLabel, ...modalProps } = props;
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <Modal {...modalProps} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const meta = {
  title: 'Components/Modal',
  component: Modal,
  // Required props of Modal; the demos below supply their own.
  args: { open: false, onClose: () => {}, title: 'Dialog' },
  parameters: {
    docs: {
      description: {
        component:
          'Focus moves in on open, Tab is trapped inside, Escape closes, the page behind is inert, and focus returns to the trigger.',
      },
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The brief's example: confirm delete, with Cancel focused first. */
export const ConfirmDelete: Story = {
  render: function Render() {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete John Doe
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          size="sm"
          title="Confirm Delete"
          description="Are you sure?"
          initialFocusRef={cancelRef}
          footer={
            <>
              <Button ref={cancelRef} variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </>
          }
        />
      </>
    );
  },
};

/** A form inside the dialog, to try the focus trap with several fields. */
export const WithForm: Story = {
  render: () => (
    <ModalDemo triggerLabel="Add user" title="Add user" footer={<Button>Create user</Button>}>
      <div className="flex flex-col gap-4">
        <Input label="Name" />
        <Input label="Email" type="email" />
      </div>
    </ModalDemo>
  ),
};
