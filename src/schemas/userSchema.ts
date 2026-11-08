import { z } from 'zod';
import { ROLES } from '@/types/user';

// The brief's schema. Zod 4 spells the email check `z.email()` (`z.string().email()` is deprecated).
export const userSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  role: z.enum(ROLES),
  isActive: z.boolean(),
});

export type UserFormValues = z.infer<typeof userSchema>;
