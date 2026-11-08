import { memo } from 'react';
import { PencilIcon, TrashIcon } from '@/components/common/icons';
import type { User } from '@/types/user';
import { cn } from '@/utils/cn';

// Shared by the paged table and the virtual list.

/** The id the delete buttons point to with aria-describedby (rendered once by UsersPage). */
export const DELETE_HELP_ID = 'delete-help';

// No colour here: two text-* classes on one element would conflict (CSS order decides, not
// class order), so each button adds its own colour.
const iconButton =
  'inline-flex h-10 w-10 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none';

/** Status in words, not only colour. */
export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
        active
          ? 'bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200'
          : 'bg-slate-200 text-slate-800',
      )}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

interface RowActionsProps {
  user: User;
  isSelf: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

// memo: a row's buttons re-render only when that user changes, not on every list update.
export const RowActions = memo(function RowActions({
  user,
  isSelf,
  onEdit,
  onDelete,
}: RowActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      <button
        type="button"
        className={cn(iconButton, 'text-slate-700 hover:bg-slate-100')}
        aria-label={`Edit user ${user.name}`}
        onClick={() => onEdit(user)}
      >
        <PencilIcon />
      </button>
      {/* You cannot delete your own account (the API refuses too). */}
      {!isSelf && (
        <button
          type="button"
          className={cn(iconButton, 'text-danger hover:bg-red-50 dark:hover:bg-red-950')}
          aria-label={`Delete user ${user.name}`}
          aria-describedby={DELETE_HELP_ID}
          onClick={() => onDelete(user)}
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
});
