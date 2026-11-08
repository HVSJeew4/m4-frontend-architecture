import { getDb } from '@/mocks/db';
import { useAuthStore } from '@/stores/authStore';

/** Starts a test already signed in (a real mock-API session, without going through the form). */
export function signInAs(email = 'admin@adminflow.test') {
  const user = getDb().users.find((u) => u.email === email);
  if (!user) throw new Error(`No seeded user ${email}`);
  const token = `t-test-${user.id}`;
  getDb().sessions[token] = user.id;
  useAuthStore.setState({ user, token, isLoading: false, error: null });
  return user;
}
