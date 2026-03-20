/**
 * src/hooks/chain.ts
 * React Query hooks for Chain Management
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as chainApi from '@/api/chain';
import type { 
  CreateChainGroupRequest,
  AddStoreRequest,
  CreateTransferRequest,
  StockTransfer
} from '@/api/chain';

// Query keys
export const chainKeys = {
  all: ['chain'] as const,
  groups: () => [...chainKeys.all, 'groups'] as const,
  group: (id: string) => [...chainKeys.groups(), id] as const,
  dashboard: (id: string) => [...chainKeys.group(id), 'dashboard'] as const,
  comparison: (id: string, period: string) => [...chainKeys.group(id), 'comparison', period] as const,
  transfers: (id: string) => [...chainKeys.group(id), 'transfers'] as const,
  suggestions: (id: string) => [...chainKeys.group(id), 'suggestions'] as const,
};

// Get chain group
export const useChainGroupQuery = (chainId: string) => {
  return useQuery({
    queryKey: chainKeys.group(chainId),
    queryFn: () => chainApi.chainApi.getGroup(chainId),
    enabled: Boolean(chainId),
    staleTime: 60000, // 1 minute
  });
};

// Get chain dashboard
export const useChainDashboardQuery = (chainId: string) => {
  return useQuery({
    queryKey: chainKeys.dashboard(chainId),
    queryFn: () => chainApi.chainApi.getDashboard(chainId),
    enabled: Boolean(chainId),
    staleTime: 30000, // 30 seconds
  });
};

// Get chain comparison
export const useChainComparisonQuery = (chainId: string, period: string) => {
  return useQuery({
    queryKey: chainKeys.comparison(chainId, period),
    queryFn: () => chainApi.chainApi.getComparison(chainId, period),
    enabled: Boolean(chainId && period),
    staleTime: 60000, // 1 minute
  });
};

// Get transfer suggestions
export const useTransferSuggestionsQuery = (chainId: string) => {
  return useQuery({
    queryKey: chainKeys.suggestions(chainId),
    queryFn: () => chainApi.chainApi.getTransferSuggestions(chainId),
    enabled: Boolean(chainId),
    staleTime: 300000, // 5 minutes
  });
};

// Get transfers
export const useTransfersQuery = (chainId: string) => {
  return useQuery({
    queryKey: chainKeys.transfers(chainId),
    queryFn: () => chainApi.chainApi.getTransfers(chainId),
    enabled: Boolean(chainId),
    staleTime: 30000, // 30 seconds
  });
};

// Create chain group mutation
export const useCreateChainGroupMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateChainGroupRequest) => chainApi.chainApi.createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chainKeys.groups() });
    },
  });
};

// Update chain group mutation
export const useUpdateChainGroupMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, data }: { chainId: string; data: Partial<CreateChainGroupRequest> }) =>
      chainApi.chainApi.updateGroup(chainId, data),
    onSuccess: (_, { chainId }) => {
      queryClient.invalidateQueries({ queryKey: chainKeys.group(chainId) });
      queryClient.invalidateQueries({ queryKey: chainKeys.groups() });
    },
  });
};

// Add store to chain mutation
export const useAddStoreToChainMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, data }: { chainId: string; data: AddStoreRequest }) =>
      chainApi.chainApi.addStore(chainId, data),
    onSuccess: (_, { chainId }) => {
      queryClient.invalidateQueries({ queryKey: chainKeys.group(chainId) });
      queryClient.invalidateQueries({ queryKey: chainKeys.dashboard(chainId) });
    },
  });
};

// Remove store from chain mutation
export const useRemoveStoreFromChainMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, storeId }: { chainId: string; storeId: string }) =>
      chainApi.chainApi.removeStore(chainId, storeId),
    onSuccess: (_, { chainId }) => {
      queryClient.invalidateQueries({ queryKey: chainKeys.group(chainId) });
      queryClient.invalidateQueries({ queryKey: chainKeys.dashboard(chainId) });
    },
  });
};

// Create transfer mutation
export const useCreateTransferMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, data }: { chainId: string; data: CreateTransferRequest }) =>
      chainApi.chainApi.createTransfer(chainId, data),
    onSuccess: (_, { chainId }) => {
      queryClient.invalidateQueries({ queryKey: chainKeys.transfers(chainId) });
      queryClient.invalidateQueries({ queryKey: chainKeys.suggestions(chainId) });
      queryClient.invalidateQueries({ queryKey: chainKeys.dashboard(chainId) });
    },
  });
};

// Update transfer status mutation
export const useUpdateTransferStatusMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, transferId, status }: { 
      chainId: string; 
      transferId: string; 
      status: StockTransfer['status'] 
    }) => chainApi.chainApi.updateTransferStatus(chainId, transferId, status),
    onSuccess: (_, { chainId }) => {
      queryClient.invalidateQueries({ queryKey: chainKeys.transfers(chainId) });
      queryClient.invalidateQueries({ queryKey: chainKeys.dashboard(chainId) });
    },
  });
};
