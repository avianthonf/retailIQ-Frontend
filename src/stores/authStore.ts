/**
 * src/stores/authStore.ts
 * Oracle Document sections consumed: 2, 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import type { CurrentUser, UserRole } from '@/types/models';
import { clearStoredRefreshToken } from '@/utils/tokenStorage';

const memoryStorage = {
  getItem: (_name: string) => null,
  setItem: (_name: string, _value: string) => undefined,
  removeItem: (_name: string) => undefined,
};

export interface AuthState {
  accessToken: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  setAccessToken: (token: string) => void;
  setUser: (user: CurrentUser) => void;
  clearAuth: () => void;
}

const authStateCreator: StateCreator<AuthState> = (set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  role: null,
  setAccessToken: (accessToken: string) => set((state: AuthState) => ({
    accessToken,
    isAuthenticated: Boolean(accessToken),
    role: state.user?.role ?? state.role,
  })),
  setUser: (user: CurrentUser) => set({
    user,
    isAuthenticated: Boolean(user),
    role: user.role,
  }),
  clearAuth: () => {
    clearStoredRefreshToken();
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      role: null,
    });
  },
});

export const authStore = create<AuthState>()(
  persist(
    authStateCreator,
    {
      name: 'retailiq-auth',
      storage: createJSONStorage(() => (typeof window === 'undefined' ? memoryStorage : window.localStorage)),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }),
    },
  ),
);
