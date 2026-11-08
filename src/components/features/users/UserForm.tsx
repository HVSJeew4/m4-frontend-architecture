import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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

interface UserFormProps {
  /** The submit button lives in the modal footer and points here with form={formId}. */
  formId: string;
  defaultValues?: UserFormValues;
  onSubmit: (values: UserFormValues) => void | Promise<void>;
}

/** Create and edit share this form; edit passes the user's current values as defaults. */
export function UserForm({ formId, defaultValues = EMPTY_USER, onSubmit }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues>({ resolver: zodResolver(userSchema), defaultValues });

  return (
    <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
