import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { authApi } from '@/api/auth';
import { configureApiAuth, errorMessage } from '@/api/client';
import type { Credentials } from '@/types/api';
import type { User } from '@/types/user';

const SESSION_EXPIRED = 'Your session has expired. Please sign in again.';

// The brief's AuthState, plus `error` (shown on the login page) and `expireSession`.
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  /** Called by the API client on a 401: signs out and tells the user why. */
  expireSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Does not throw: the outcome is in the store (user or error), which the login page renders.
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await authApi.login(credentials);
          set({ user, token, isLoading: false });
        } catch (error) {
          set({ isLoading: false, error: errorMessage(error) });
        }
      },

      logout: () => {
        const { token } = get();
        if (token) {
          // Fire and forget: the user is signed out locally even if this request fails.
          // The token is passed in because the state below clears it before the request is sent.
          authApi.logout(token).catch(() => {});
        }
        set({ user: null, token: null, error: null });
      },

      expireSession: () => set({ user: null, token: null, error: SESSION_EXPIRED }),
    }),
    {
      name: 'adminflow:auth',
      // sessionStorage: survives a reload, ends when the tab closes. sessionStorage reads are
      // synchronous, so the session is there on the first render (no flash of the login page).
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ user, token }) => ({ user, token }),
    },
  ),
);

configureApiAuth({
  getToken: () => useAuthStore.getState().token,
  onUnauthorized: () => useAuthStore.getState().expireSession(),
});
