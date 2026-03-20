/**
 * src/api/payments.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request } from '@/api/client';
import type {
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  ListPaymentProvidersRequest,
  ListPaymentProvidersResponse,
} from '@/types/api';

export const listPaymentProviders = (filters: ListPaymentProvidersRequest = {}) => request<ListPaymentProvidersResponse>({ url: '/api/v1/payments/providers', method: 'GET', params: filters });
export const createPaymentIntent = (payload: CreatePaymentIntentRequest) => request<CreatePaymentIntentResponse>({ url: '/api/v1/payments/intent', method: 'POST', data: payload });
