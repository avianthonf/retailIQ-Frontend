/**
 * src/hooks/payments.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import * as paymentsApi from '@/api/payments';
import type { CreatePaymentIntentRequest, ListPaymentProvidersRequest } from '@/types/api';

export const usePaymentProvidersQuery = (filters: ListPaymentProvidersRequest = {}) => useQuery({ queryKey: ['payments', 'providers', filters], queryFn: () => paymentsApi.listPaymentProviders(filters), staleTime: 60_000 });
export const useCreatePaymentIntentMutation = () => useMutation({ mutationFn: (payload: CreatePaymentIntentRequest) => paymentsApi.createPaymentIntent(payload) });
