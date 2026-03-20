/**
 * src/hooks/kyc.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import * as kycApi from '@/api/kyc';
import type { ListKycProvidersRequest, VerifyKycRequest } from '@/types/api';

export const useKycProvidersQuery = (filters: ListKycProvidersRequest = {}) => useQuery({ queryKey: ['kyc', 'providers', filters], queryFn: () => kycApi.listKycProviders(filters), staleTime: 60_000 });
export const useKycStatusQuery = () => useQuery({ queryKey: ['kyc', 'status'], queryFn: kycApi.listKycStatus, staleTime: 30_000 });
export const useVerifyKycMutation = () => useMutation({ mutationFn: (payload: VerifyKycRequest) => kycApi.verifyKyc(payload) });
