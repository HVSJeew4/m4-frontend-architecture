import { useId, useRef, useState } from 'react';
import { ApiError, errorMessage } from '@/api/client';
import { useCreateUser, useUpdateUser } from '@/api/users';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import type { UserFormValues } from '@/schemas/userSchema';
import { useNotify } from '@/stores/notificationStore';
import type { User } from '@/types/user';
import { UserForm } from './UserForm';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Edit this user; omit to create a new one. */
  user?: User | null;
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const formId = useId();
  const notify = useNotify();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [dirty, setDirty] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  /** Closes for real (after saving, or after "Discard"). */
  function finish() {
    createUser.reset();
    setDirty(false);
    setConfirmingDiscard(false);
    onClose();
  }

  /** Cancel, Escape and the backdrop all come here: unsaved changes need a confirmation first. */
  function requestClose() {
    if (dirty) setConfirmingDiscard(true);
    else finish();
  }

  // A failure is not caught here on purpose: it reaches UserForm, which puts field errors
  // (e.g. duplicate email) on the field; other errors show in the alert below (createUser.error).
  async function handleCreate(values: UserFormValues) {
    const created = await createUser.mutateAsync(values);
    notify({ level: 'success', title: 'User created', message: `${created.name} was added.` });
    finish();
  }

  function handleUpdate(existing: User, changes: Partial<UserFormValues>) {
    // Nothing really changed (maybe only spaces or letter case): no request, no "Changes saved".
    if (Object.keys(changes).length === 0) {
      finish();
      return;
    }
    // Optimistic: close at once – the row already shows the new values. On failure the row
    // rolls back (see useUpdateUser) and the toast explains why. Only changed fields are sent,
    // so this edit cannot overwrite another admin's change to a different field.
    // mutateAsync, not mutate(…, callbacks): closing unmounts this component, and React Query
    // drops mutate() callbacks of an unmounted component – the toast would never appear.
    updateUser
      .mutateAsync({ id: existing.id, input: changes })
      .then((updated) =>
        notify({
          level: 'success',
          title: 'Changes saved',
          message: `${updated.name} was updated.`,
        }),
      )
      .catch((error: unknown) =>
        notify({
          level: 'error',
          title: `Could not update ${existing.name}`,
          message: errorMessage(error),
        }),
      );
    finish();
  }

  // Field errors are shown on the fields by UserForm; only other failures need an alert.
  const generalError =
    createUser.error && !(createUser.error instanceof ApiError && createUser.error.hasFieldErrors)
      ? createUser.error
      : null;

  return (
    <>
      <Modal
        open={open}
        onClose={requestClose}
        title={user ? `Edit ${user.name}` : 'Add user'}
        footer={
          <>
            <Button variant="secondary" onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" form={formId} isLoading={createUser.isPending}>
              {user ? 'Save changes' : 'Create user'}
            </Button>
          </>
        }
      >
        {generalError && (
          <Alert variant="error" title="Could not create the user" className="mb-4">
            {errorMessage(generalError)}
          </Alert>
        )}
        <UserForm
          formId={formId}
          defaultValues={
            user
              ? { name: user.name, email: user.email, role: user.role, isActive: user.isActive }
              : undefined
          }
          onDirtyChange={setDirty}
          onSubmit={user ? (_values, changes) => handleUpdate(user, changes) : handleCreate}
        />
      </Modal>
      {/* A sibling of the form dialog (not inside it), so its Escape key does not reach the form dialog. */}
      <DiscardChangesDialog
        open={open && confirmingDiscard}
        onKeepEditing={() => setConfirmingDiscard(false)}
        onDiscard={finish}
      />
    </>
  );
}

function DiscardChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) {
  const keepRef = useRef<HTMLButtonElement>(null);
  return (
    <Modal
      open={open}
      onClose={onKeepEditing}
      size="sm"
      title="Discard changes?"
      description="The changes you made in this form will be lost."
      // The safe choice gets focus, so pressing Enter by reflex loses nothing.
      initialFocusRef={keepRef}
      footer={
        <>
          <Button ref={keepRef} variant="secondary" onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={onDiscard}>
            Discard
          </Button>
        </>
      }
    />
  );
}
