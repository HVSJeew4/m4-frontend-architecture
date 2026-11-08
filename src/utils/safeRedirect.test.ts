import { describe, expect, it } from 'vitest';
import { getSafeRedirect } from './safeRedirect';

describe('getSafeRedirect', () => {
  it.each(['/users', '/users?page=2&sortBy=name', '/notifications#top'])(
    'keeps the in-app path %s',
    (path) => {
      expect(getSafeRedirect(path)).toBe(path);
    },
  );

  // React Router v6 has an open-redirect advisory for backslash paths; we never pass them on.
  it.each([
    ['protocol-relative URL', '//evil.example'],
    ['backslash trick', '/\\evil.example'],
    ['absolute URL', 'https://evil.example/users'],
    ['javascript: URL', 'javascript:alert(1)'],
    ['relative path', 'users'],
    ['the login page itself', '/login'],
    ['empty string', ''],
    ['not a string', { pathname: '/users' }],
    ['undefined', undefined],
  ])('falls back to the dashboard for a %s', (_case, value) => {
    expect(getSafeRedirect(value)).toBe('/dashboard');
  });
});
