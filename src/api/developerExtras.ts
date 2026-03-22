import { request } from './client';

const DEVELOPER_BASE = '/api/v1/developer';

export interface DeveloperMarketplaceApp {
  id: string;
  name: string;
  tagline: string;
  category: string;
  price: string;
  install_count: number;
  avg_rating: string;
}

export interface DeveloperRegistrationRequest {
  name: string;
  email: string;
  organization?: string;
}

export interface DeveloperRegistrationResponse {
  id: string;
  name: string;
  email: string;
  message: string;
}

export const developerExtrasApi = {
  registerDeveloper: (data: DeveloperRegistrationRequest) =>
    request<DeveloperRegistrationResponse>({
      url: `${DEVELOPER_BASE}/register`,
      method: 'POST',
      data,
    }),

  getMarketplace: () =>
    request<DeveloperMarketplaceApp[]>({
      url: `${DEVELOPER_BASE}/marketplace`,
      method: 'GET',
    }),
};
