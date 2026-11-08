import { useId } from 'react';
import { errorMessage } from '@/api/client';
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

  async function handleCreate(values: UserFormValues) {
    try {
      const created = await createUser.mutateAsync(values);
      notify({ level: 'success', title: 'User created', message: `${created.name} was added.` });
      onClose();
    } catch {
      // The error is shown inside the dialog (createUser.error) so the form keeps its values.
    }
  }

  function handleUpdate(existing: User, values: UserFormValues) {
    // Optimistic: close at once – the row already shows the new values. On failure the row
    // rolls back (see useUpdateUser) and the toast explains why.
    // mutateAsync, not mutate(…, callbacks): closing unmounts this component, and React Query
    // drops mutate() callbacks of an unmounted component – the toast would never appear.
    updateUser
      .mutateAsync({ id: existing.id, input: values })
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
    onClose();
  }

  function close() {
    createUser.reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={user ? `Edit ${user.name}` : 'Add user'}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form={formId} isLoading={createUser.isPending}>
            {user ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      {createUser.isError && (
        <Alert variant="error" title="Could not create the user" className="mb-4">
          {errorMessage(createUser.error)}
        </Alert>
      )}
      <UserForm
        formId={formId}
        defaultValues={
          user
            ? { name: user.name, email: user.email, role: user.role, isActive: user.isActive }
            : undefined
        }
        onSubmit={user ? (values) => handleUpdate(user, values) : handleCreate}
      />
    </Modal>
  );
}
