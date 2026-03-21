/**
 * src/api/kyc.ts
 * Backend-aligned KYC adapters
 */
import { requestAny } from '@/api/client';
import type {
  ListKycProvidersRequest,
  ListKycProvidersResponse,
  ListKycStatusResponse,
  VerifyKycRequest,
  VerifyKycResponse,
} from '@/types/api';

export const listKycProviders = async (filters: ListKycProvidersRequest = {}): Promise<ListKycProvidersResponse> => {
  const { data } = await requestAny<ListKycProvidersResponse['providers']>([
    { url: '/api/v1/kyc/kyc/providers', method: 'GET', params: filters },
    { url: '/api/v1/kyc/providers', method: 'GET', params: filters },
  ]);
  return { providers: Array.isArray(data) ? data : [] };
};

export const verifyKyc = async (payload: VerifyKycRequest): Promise<VerifyKycResponse> => {
  const { data } = await requestAny<VerifyKycResponse>([
    { url: '/api/v1/kyc/kyc/verify', method: 'POST', data: payload },
    { url: '/api/v1/kyc/verify', method: 'POST', data: payload },
  ]);
  return data;
};

export const listKycStatus = async (): Promise<ListKycStatusResponse> => {
  const { data } = await requestAny<ListKycStatusResponse['records']>([
    { url: '/api/v1/kyc/kyc/status', method: 'GET' },
    { url: '/api/v1/kyc/status', method: 'GET' },
  ]);
  return { records: Array.isArray(data) ? data : [] };
};
