/**
 * src/utils/tokenStorage.ts
 * Oracle Document sections consumed: 2, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
const REFRESH_TOKEN_KEY = 'retailiq_refresh_token';

export function getStoredRefreshToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredRefreshToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearStoredRefreshToken() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
