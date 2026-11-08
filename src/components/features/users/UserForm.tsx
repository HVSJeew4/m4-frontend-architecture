import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type Path } from 'react-hook-form';
import { ApiError } from '@/api/client';
import { Checkbox } from '@/components/common/Checkbox';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { userSchema, type UserFormValues } from '@/schemas/userSchema';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

const EMPTY_USER: UserFormValues = { name: '', email: '', role: 'user', isActive: true };
const FIELDS = Object.keys(EMPTY_USER) as (keyof UserFormValues)[];

interface UserFormProps {
  /** The submit button lives in the modal footer and points here with form={formId}. */
  formId: string;
  defaultValues?: UserFormValues;
  /**
   * `changes` holds only the fields that differ from `defaultValues` (after trimming etc.), so an
   * edit can send just those. Throw an ApiError with fieldErrors to show them on the fields.
   */
  onSubmit: (values: UserFormValues, changes: Partial<UserFormValues>) => void | Promise<void>;
  /** Tells the parent whether there are unsaved changes (for the "Discard changes?" guard). */
  onDirtyChange?: (dirty: boolean) => void;
}

/** Create and edit share this form; edit passes the user's current values as defaults. */
export function UserForm({
  formId,
  defaultValues = EMPTY_USER,
  onSubmit,
  onDirtyChange,
}: UserFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // React Hook Form focuses the first invalid field itself (shouldFocusError), which works because
  // Input/Select/Checkbox forward their ref to the real control.
  const submit = handleSubmit(async (values) => {
    const changes = Object.fromEntries(
      FIELDS.filter((field) => values[field] !== defaultValues[field]).map((field) => [
        field,
        values[field],
      ]),
    ) as Partial<UserFormValues>;
    try {
      await onSubmit(values, changes);
    } catch (error) {
      // Server validation (400) and conflicts (409) belong next to the field they are about.
      // Anything else is shown by the parent (it has the mutation's error state).
      if (!(error instanceof ApiError)) return;
      const fieldErrors = Object.entries(error.fieldErrors).filter(([field]) =>
        FIELDS.includes(field as keyof UserFormValues),
      );
      fieldErrors.forEach(([field, message], index) =>
        setError(
          field as Path<UserFormValues>,
          { type: 'server', message },
          { shouldFocus: index === 0 },
        ),
      );
    }
  });

  return (
    <form id={formId} noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label="Name"
        autoComplete="off"
        required
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="off"
        required
        error={errors.email?.message}
        {...register('email')}
      />
      <Select
        label="Role"
        options={ROLE_OPTIONS}
        required
        error={errors.role?.message}
        {...register('role')}
      />
      <Checkbox
        label="Active"
        hint="Inactive users cannot sign in."
        error={errors.isActive?.message}
        {...register('isActive')}
      />
    </form>
  );
}
