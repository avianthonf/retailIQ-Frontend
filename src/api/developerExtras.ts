import axios from 'axios';
import { extractEnvelope, request } from '@/api/client';

const getBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

const resolveUrl = (path: string) => {
  const baseUrl = getBaseUrl();
  return baseUrl ? new URL(path, `${baseUrl}/`).toString() : path;
};

export interface DeveloperRegistrationRequest {
  name: string;
  email: string;
  organization?: string;
}

export interface DeveloperRegistrationResponse {
  id: string | number;
  name: string;
  email: string;
  message: string;
}

export interface DeveloperMarketplaceApp {
  id: string | number;
  name: string;
  tagline: string;
  category: string;
  price: string;
  install_count: number;
  avg_rating: string;
}

export interface DeveloperV2ExplorerResult<T = unknown> {
  status: number;
  data: T;
}

export const registerDeveloperProfile = (data: DeveloperRegistrationRequest) =>
  request<DeveloperRegistrationResponse>({ url: '/api/v1/developer/register', method: 'POST', data });

export const getDeveloperMarketplace = () =>
  request<DeveloperMarketplaceApp[]>({ url: '/api/v1/developer/marketplace', method: 'GET' });

export async function exploreV2Inventory(oauthToken: string, storeId: string) {
  const response = await axios.get(resolveUrl('/api/v2/inventory'), {
    params: { store_id: storeId },
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${oauthToken}`,
    },
  });

  const envelope = extractEnvelope<unknown>(response.data);

  return {
    status: response.status,
    data: envelope.data,
  } as DeveloperV2ExplorerResult;
}

export async function exploreV2Sales(oauthToken: string, storeId: string) {
  const response = await axios.get(resolveUrl('/api/v2/sales'), {
    params: { store_id: storeId },
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${oauthToken}`,
    },
  });

  const envelope = extractEnvelope<unknown>(response.data);

  return {
    status: response.status,
    data: envelope.data,
  } as DeveloperV2ExplorerResult;
}
