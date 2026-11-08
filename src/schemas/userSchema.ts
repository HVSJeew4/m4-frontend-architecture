import { z } from 'zod';
import { ROLES } from '@/types/user';

// The brief's schema, with input clean-up:
// - name is trimmed before the length check, so "  A " does not pass as 4 characters;
// - email is trimmed and lower-cased *before* the format check (pipe), so " Ada@Example.COM "
//   is accepted and stored as "ada@example.com" – the same address the server compares against.
// Zod 4 spells the email check `z.email()` (`z.string().email()` is deprecated).
export const userSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().pipe(z.email('Invalid email address')),
  role: z.enum(ROLES),
  isActive: z.boolean(),
});

export type UserFormValues = z.infer<typeof userSchema>;
