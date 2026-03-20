/**
 * src/utils/session.ts
 * Oracle Document sections consumed: 2, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { AuthTokens, CurrentUser } from '@/types/models';
import { authStore } from '@/stores/authStore';
import { clearStoredRefreshToken, setStoredRefreshToken } from '@/utils/tokenStorage';

export const persistAuthTokens = (tokens: AuthTokens, userOverrides: Partial<CurrentUser> = {}) => {
  authStore.getState().setAccessToken(tokens.access_token);
  authStore.getState().setUser({
    user_id: tokens.user_id,
    role: tokens.role,
    store_id: tokens.store_id,
    ...userOverrides,
  });
  setStoredRefreshToken(tokens.refresh_token);
};

export const clearSession = () => {
  clearStoredRefreshToken();
  authStore.getState().clearAuth();
};
