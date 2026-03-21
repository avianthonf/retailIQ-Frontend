/**
 * src/hooks/loyalty.ts
 * React Query hooks for Loyalty operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as loyaltyApi from '@/api/loyalty';
import type { 
  LoyaltyProgram,
  LoyaltyTier,
  RedemptionRequest,
  PointsAdjustmentRequest,
} from '@/api/loyalty';

// Query keys
export const loyaltyKeys = {
  all: ['loyalty'] as const,
  program: () => [...loyaltyKeys.all, 'program'] as const,
  accounts: (params?: Record<string, unknown>) => [...loyaltyKeys.all, 'accounts', ...(params ? [params] : [])] as const,
  account: (customerId: string) => [...loyaltyKeys.all, 'account', customerId] as const,
  transactions: (customerId: string, params?: Record<string, unknown>) => [...loyaltyKeys.all, 'transactions', customerId, ...(params ? [params] : [])] as const,
  analytics: (params?: Record<string, unknown>) => [...loyaltyKeys.all, 'analytics', ...(params ? [params] : [])] as const,
  expiring: (days: number) => [...loyaltyKeys.all, 'expiring', days] as const,
};

// Program Management
export const useLoyaltyProgramQuery = () => {
  return useQuery({
    queryKey: loyaltyKeys.program(),
    queryFn: () => loyaltyApi.loyaltyApi.getProgram(),
    staleTime: 60000, // 1 minute
  });
};

export const useUpdateLoyaltyProgramMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<LoyaltyProgram>) => loyaltyApi.loyaltyApi.updateProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.program() });
    },
  });
};

// Tier Management
export const useCreateTierMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<LoyaltyTier, 'id' | 'created_at'>) => loyaltyApi.loyaltyApi.createTier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.program() });
    },
  });
};

export const useUpdateTierMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LoyaltyTier> }) =>
      loyaltyApi.loyaltyApi.updateTier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.program() });
    },
  });
};

export const useDeleteTierMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => loyaltyApi.loyaltyApi.deleteTier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.program() });
    },
  });
};

// Customer Accounts
export const useLoyaltyAccountQuery = (customerId: string) => {
  return useQuery({
    queryKey: loyaltyKeys.account(customerId),
    queryFn: () => loyaltyApi.loyaltyApi.getAccount(customerId),
    enabled: Boolean(customerId),
    staleTime: 30000, // 30 seconds
  });
};

export const useLoyaltyAccountsQuery = (params?: {
  query?: string;
  tier_id?: string;
  min_points?: number;
  max_points?: number;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: loyaltyKeys.accounts(params),
    queryFn: () => loyaltyApi.loyaltyApi.searchAccounts(params),
    staleTime: 30000, // 30 seconds
  });
};

// Transactions
export const useLoyaltyTransactionsQuery = (customerId: string, params?: {
  type?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: loyaltyKeys.transactions(customerId, params),
    queryFn: () => loyaltyApi.loyaltyApi.getTransactions(customerId, params),
    enabled: Boolean(customerId),
    staleTime: 30000, // 30 seconds
  });
};

// Points Operations
export const useRedeemPointsMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RedemptionRequest) => loyaltyApi.loyaltyApi.redeemPoints(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.account(variables.customer_id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.transactions(variables.customer_id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.analytics() });
    },
  });
};

export const useAdjustPointsMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PointsAdjustmentRequest) => loyaltyApi.loyaltyApi.adjustPoints(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.account(variables.customer_id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.transactions(variables.customer_id) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.analytics() });
    },
  });
};

export const useBulkAdjustPointsMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (adjustments: PointsAdjustmentRequest[]) => loyaltyApi.loyaltyApi.bulkAdjustPoints(adjustments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.analytics() });
    },
  });
};

// Analytics
export const useLoyaltyAnalyticsQuery = (params?: {
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: loyaltyKeys.analytics(params),
    queryFn: () => loyaltyApi.loyaltyApi.getAnalytics(params),
    staleTime: 300000, // 5 minutes
  });
};

// Expiry Management
export const useExpiringPointsQuery = (days: number = 30) => {
  return useQuery({
    queryKey: loyaltyKeys.expiring(days),
    queryFn: () => loyaltyApi.loyaltyApi.getExpiringPoints(days),
    staleTime: 60000, // 1 minute
  });
};

// Customer Enrollment
export const useEnrollCustomerMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customerId: string) => loyaltyApi.loyaltyApi.enrollCustomer(customerId),
    onSuccess: (_, customerId) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.account(customerId) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.analytics() });
    },
  });
};

// Tier Management for Customers
export const useUpdateCustomerTierMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ customerId, tierId }: { customerId: string; tierId: string }) =>
      loyaltyApi.loyaltyApi.updateCustomerTier(customerId, tierId),
    onSuccess: (_, { customerId }) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.account(customerId) });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.analytics() });
    },
  });
};
