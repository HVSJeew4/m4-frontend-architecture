const FALLBACK = '/dashboard';

/**
 * Where to go after sign-in. Only plain in-app paths ("/users?page=2") are allowed, so a crafted
 * link cannot send the user to another site after they log in (open redirect). Backslashes are
 * rejected because browsers treat "/\evil.com" like "//evil.com" (React Router v6 advisory).
 */
export function getSafeRedirect(from: unknown): string {
  if (typeof from !== 'string' || !from.startsWith('/')) return FALLBACK;
  if (from.startsWith('//') || from.includes('\\')) return FALLBACK;
  if (from === '/login' || from.startsWith('/login?')) return FALLBACK;
  return from;
}
