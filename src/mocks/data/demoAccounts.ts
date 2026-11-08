import type { Role } from '@/types/user';

// Own module so the login page can list these without pulling the seed generator into the main
// bundle. Any password of 8+ characters works (no secrets stored).
export const DEMO_ACCOUNTS = [
  { email: 'admin@adminflow.test', name: 'Avery Admin', role: 'admin' },
  { email: 'editor@adminflow.test', name: 'Eden Editor', role: 'editor' },
  { email: 'user@adminflow.test', name: 'Umar User', role: 'user' },
] as const satisfies readonly { email: string; name: string; role: Role }[];
