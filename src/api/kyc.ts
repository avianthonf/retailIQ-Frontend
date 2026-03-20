/**
 * src/api/kyc.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request } from '@/api/client';
import type {
  ListKycProvidersRequest,
  ListKycProvidersResponse,
  ListKycStatusResponse,
  VerifyKycRequest,
  VerifyKycResponse,
} from '@/types/api';

export const listKycProviders = (filters: ListKycProvidersRequest = {}) => request<ListKycProvidersResponse>({ url: '/api/v1/kyc/providers', method: 'GET', params: filters });
export const verifyKyc = (payload: VerifyKycRequest) => request<VerifyKycResponse>({ url: '/api/v1/kyc/verify', method: 'POST', data: payload });
export const listKycStatus = () => request<ListKycStatusResponse>({ url: '/api/v1/kyc/status', method: 'GET' });
