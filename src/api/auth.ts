import type { AuthResponse, Credentials } from '@/types/api';
import { apiFetch } from './client';

export const authApi = {
  login: (credentials: Credentials) =>
    apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: credentials }),
  logout: (token: string) => apiFetch<void>('/api/auth/logout', { method: 'POST', token }),
};
