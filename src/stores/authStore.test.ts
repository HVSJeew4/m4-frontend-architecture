import { beforeEach, describe, expect, it } from 'vitest';
import { apiFetch, ApiError } from '@/api/client';
import { getDb } from '@/mocks/db';
import type { User } from '@/types/user';
import { useAuthStore } from './authStore';

const ADMIN = { email: 'admin@adminflow.test', password: 'long-enough' };

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isLoading: false, error: null });
  });

  it('starts signed out', () => {
    const { user, token, isLoading, error } = useAuthStore.getState();
    expect({ user, token, isLoading, error }).toEqual({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  });

  it('signs in: isLoading while waiting, then user and token', async () => {
    const pending = useAuthStore.getState().login(ADMIN);
    expect(useAuthStore.getState().isLoading).toBe(true);
    await pending;

    const { user, token, isLoading, error } = useAuthStore.getState();
    expect(user?.email).toBe('admin@adminflow.test');
    expect(token).toMatch(/^t/);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('keeps the session in sessionStorage (survives a reload, not a closed tab)', async () => {
    await useAuthStore.getState().login(ADMIN);
    const saved = JSON.parse(sessionStorage.getItem('adminflow:auth') ?? '{}') as {
      state?: { user?: User; token?: string; isLoading?: boolean };
    };
    expect(saved.state?.user?.email).toBe(ADMIN.email);
    expect(saved.state?.token).toBe(useAuthStore.getState().token);
    // Only the session is stored, not transient UI state.
    expect(saved.state).not.toHaveProperty('isLoading');
  });

  it('stores the server message when sign-in fails', async () => {
    await useAuthStore.getState().login({ email: 'user@adminflow.test', password: 'long-enough' });
    const { user, error, isLoading } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBe('This account does not have admin access');
  });

  it('clears the previous error when signing in again', async () => {
    useAuthStore.setState({ error: 'Old error' });
    await useAuthStore.getState().login(ADMIN);
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('signs out locally and ends the session on the server', async () => {
    await useAuthStore.getState().login(ADMIN);
    const { token } = useAuthStore.getState();

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();

    await expect.poll(() => getDb().sessions[token!]).toBeUndefined();
  });

  it('sends the token with API requests', async () => {
    await useAuthStore.getState().login(ADMIN);
    const me = await apiFetch<User>('/api/auth/me');
    expect(me.email).toBe(ADMIN.email);
  });

  it('expires the session when the API answers 401', async () => {
    await useAuthStore.getState().login(ADMIN);
    getDb().sessions = {}; // the server forgets the session

    await expect(apiFetch('/api/auth/me')).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().error).toBe('Your session has expired. Please sign in again.');
  });
});
