import { useRef, type RefObject } from 'react';
import { errorMessage } from '@/api/client';
import { useDeleteUser, useRestoreUser } from '@/api/users';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useNotify } from '@/stores/notificationStore';
import type { User } from '@/types/user';

interface DeleteUserDialogProps {
  user: User | null;
  onClose: () => void;
  /** Where focus goes after a delete (the row and its button are gone). */
  afterDeleteFocusRef: RefObject<HTMLElement | null>;
}

export function DeleteUserDialog({ user, onClose, afterDeleteFocusRef }: DeleteUserDialogProps) {
  const notify = useNotify();
  const deleteUser = useDeleteUser();
  const restoreUser = useRestoreUser();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const finalFocusRef = useRef<HTMLElement | null>(null);

  function close() {
    deleteUser.reset();
    onClose();
  }

  async function confirm() {
    if (!user) return;
    try {
      await deleteUser.mutateAsync(user.id);
    } catch {
      return; // shown in the dialog
    }
    finalFocusRef.current = afterDeleteFocusRef.current;
    close();
    const { id, name } = user;
    notify({
      level: 'success',
      title: 'User deleted',
      message: `${name} was deleted.`,
      action: {
        label: 'Undo',
        // mutateAsync, not mutate(…, callbacks): the promise settles even if this dialog unmounts.
        onClick: () =>
          restoreUser
            .mutateAsync(id)
            .then(() =>
              notify({ level: 'success', title: 'User restored', message: `${name} is back.` }),
            )
            .catch((error: unknown) =>
              notify({
                level: 'error',
                title: `Could not restore ${name}`,
                message: errorMessage(error),
              }),
            ),
      },
    });
  }

  return (
    <Modal
      open={user !== null}
      onClose={close}
      size="sm"
      title="Delete user?"
      description={
        user && (
          <p>{user.name} will be removed from the user list. You can undo this right after.</p>
        )
      }
      // Cancel gets focus first: the safe choice for a destructive action.
      initialFocusRef={cancelRef}
      finalFocusRef={finalFocusRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} isLoading={deleteUser.isPending}>
            Delete user
          </Button>
        </>
      }
    >
      {deleteUser.isError && (
        <Alert variant="error" title="Could not delete the user">
          {errorMessage(deleteUser.error)}
        </Alert>
      )}
    </Modal>
  );
}
