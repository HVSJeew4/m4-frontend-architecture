import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { loginSchema, type LoginFormValues } from '@/schemas/loginSchema';
import { useAuthStore } from '@/stores/authStore';

export function LoginForm() {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    // noValidate: Zod does the validation, with our messages, instead of the browser's pop-ups.
    <form noValidate onSubmit={handleSubmit(login)} className="flex flex-col gap-4">
      {error && <Alert variant="error" title={error} />}
      <Input
        label="Email"
        type="email"
        autoComplete="username"
        required
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
        Sign in
      </Button>
    </form>
  );
}
