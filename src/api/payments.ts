/**
 * src/api/payments.ts
 * Backend-aligned payment adapters
 */
import { request } from '@/api/client';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  ListPaymentProvidersRequest,
  ListPaymentProvidersResponse,
} from '@/types/api';

export const listPaymentProviders = async (filters: ListPaymentProvidersRequest = {}): Promise<ListPaymentProvidersResponse> => {
  const providers = await request<ListPaymentProvidersResponse['providers']>({ url: '/api/v1/payments/providers', method: 'GET', params: filters });
  return { providers: Array.isArray(providers) ? providers : [] };
};
export const createPaymentIntent = (payload: CreatePaymentIntentRequest) => request<CreatePaymentIntentResponse>({ url: '/api/v1/payments/intent', method: 'POST', data: payload });
