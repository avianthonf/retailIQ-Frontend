/**
 * src/api/client.ts
 * Oracle Document sections consumed: 2, 3, 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import axios, {
  AxiosHeaders,
  isAxiosError,
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { authStore } from '@/stores/authStore';
import type { StandardEnvelope } from '@/types/api';
import type { AuthTokens } from '@/types/models';
import { normalizeApiError } from '@/utils/errors';
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from '@/utils/tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
const SERVER_REFERENCE_ID_KEY = 'retailiq_reference_id';
let isRedirecting = false;
let refreshPromise: Promise<AuthTokens | null> | null = null;

export const apiClient = axios.create({
  baseURL: BASE_URL || undefined,
  withCredentials: false,
  headers: {
    Accept: 'application/json',
  },
});

const resolvePath = (path: string) => {
  if (!BASE_URL) {
    return path;
  }

  return new URL(path, `${BASE_URL}/`).toString();
};

const isFormData = (value: unknown): value is FormData => typeof FormData !== 'undefined' && value instanceof FormData;

const isIdempotentRequest = (config?: AxiosRequestConfig) => {
  const method = config?.method?.toUpperCase();
  if (!method || ['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const headers = config?.headers as Record<string, unknown> | undefined;
  if (!headers) {
    return false;
  }

  return Boolean(headers['Idempotency-Key'] ?? headers['idempotency-key'] ?? headers['X-Idempotency-Key']);
};

const unwrapEnvelope = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object') {
    const envelope = payload as StandardEnvelope<T> & Record<string, unknown>;
    if (typeof envelope.success === 'boolean' && 'data' in envelope) {
      return envelope.data as T;
    }
  }

  return payload as T;
};

const shouldSkipRefresh = (config?: AxiosRequestConfig) => {
  const url = config?.url ?? '';
  return [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/verify-otp',
    '/api/v1/auth/resend-otp',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/mfa/setup',
    '/api/v1/auth/mfa/verify',
    '/api/v1/auth/refresh',
  ].some((path) => url.includes(path));
};

const redirectToLogin = () => {
  if (typeof window === 'undefined' || isRedirecting) {
    return;
  }

  isRedirecting = true;
  window.location.assign('/login');
};

const captureServerReferenceId = (error: { status?: number; correlationId?: string }) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (error.status && error.status >= 500 && error.correlationId) {
    window.sessionStorage.setItem(SERVER_REFERENCE_ID_KEY, error.correlationId);
    return;
  }

  if (error.status && error.status >= 500) {
    window.sessionStorage.removeItem(SERVER_REFERENCE_ID_KEY);
    return;
  }

  if (error.status && error.status < 500) {
    window.sessionStorage.removeItem(SERVER_REFERENCE_ID_KEY);
  }
};

const refreshAccessToken = async (): Promise<AuthTokens | null> => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    return null;
  }

  const response = await axios.post(resolvePath('/api/v1/auth/refresh'), { refresh_token: refreshToken }, { headers: { Accept: 'application/json' } });
  const payload = unwrapEnvelope<AuthTokens>(response.data);

  if (payload?.access_token && payload?.refresh_token) {
    authStore.getState().setAccessToken(payload.access_token);
    setStoredRefreshToken(payload.refresh_token);
    return payload;
  }

  return null;
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = authStore.getState().accessToken;
  if (accessToken) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    } else {
      config.headers = AxiosHeaders.from(config.headers ?? {});
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse<unknown>) => response,
  async (error: unknown) => {
    if (!isAxiosError(error)) {
      const normalized = normalizeApiError(error);
      captureServerReferenceId(normalized);
      return Promise.reject(normalized);
    }

    const axiosError = error as AxiosError;
    const originalRequest = axiosError.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry && !shouldSkipRefresh(originalRequest)) {
      if (isFormData(originalRequest.data)) {
        authStore.getState().clearAuth();
        clearStoredRefreshToken();
        redirectToLogin();
        const normalized = normalizeApiError(error);
        captureServerReferenceId(normalized);
        return Promise.reject(normalized);
      }

      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }

        const refreshed = await refreshPromise;
        refreshPromise = null;

        if (refreshed?.access_token) {
          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${refreshed.access_token}`,
          };

          return apiClient.request(originalRequest);
        }
      } catch (refreshError) {
        refreshPromise = null;
        authStore.getState().clearAuth();
        clearStoredRefreshToken();
        redirectToLogin();
        const normalizedRefreshError = normalizeApiError(refreshError);
        captureServerReferenceId(normalizedRefreshError);
        return Promise.reject(normalizedRefreshError);
      }

      authStore.getState().clearAuth();
      clearStoredRefreshToken();
      redirectToLogin();
      const normalized = normalizeApiError(error);
      captureServerReferenceId(normalized);
      return Promise.reject(normalized);
    }

    const normalized = normalizeApiError(error);
    captureServerReferenceId(normalized);
    return Promise.reject(normalized);
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<unknown>(config);
  return unwrapEnvelope<T>(response.data);
}

export interface ApiEnvelope<T> {
  data: T;
  meta: Record<string, unknown> | null;
  message?: string;
  success?: boolean;
  error?: unknown;
  raw: unknown;
}

export function extractEnvelope<T>(payload: unknown): ApiEnvelope<T> {
  if (payload && typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;
    if (
      'data' in candidate
      && ('success' in candidate || 'meta' in candidate || 'error' in candidate || 'message' in candidate)
    ) {
      return {
        data: candidate.data as T,
        meta: (candidate.meta as Record<string, unknown> | null | undefined) ?? null,
        message: typeof candidate.message === 'string' ? candidate.message : undefined,
        success: typeof candidate.success === 'boolean' ? candidate.success : undefined,
        error: candidate.error,
        raw: payload,
      };
    }
  }

  return {
    data: payload as T,
    meta: null,
    raw: payload,
  };
}

export async function requestEnvelope<T>(config: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
  const response = await apiClient.request<unknown>(config);
  return extractEnvelope<T>(response.data);
}

export async function requestAny<T>(configs: AxiosRequestConfig[]): Promise<ApiEnvelope<T>> {
  let lastError: unknown;

  for (const config of configs) {
    try {
      return await requestEnvelope<T>(config);
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 404 || normalized.status === 405) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('Request failed.');
}

export async function requestBlob(config: AxiosRequestConfig): Promise<Blob> {
  const response = await apiClient.request<Blob>({ ...config, responseType: 'blob' });
  return response.data;
}

export async function postForm<T>(url: string, data: FormData, config: AxiosRequestConfig = {}): Promise<T> {
  return request<T>({ ...config, url, method: 'POST', data });
}

export const unsupportedApi = <T = never>(feature: string): Promise<T> => Promise.reject(
  normalizeApiError({
    message: `${feature} is not supported by the current backend.`,
    status: 501,
  }),
);

export const safeRetryable = isIdempotentRequest;
