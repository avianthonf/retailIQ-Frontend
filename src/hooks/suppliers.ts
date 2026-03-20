/**
 * src/hooks/suppliers.ts
 * Oracle Document sections consumed: 3.2, 5.2
 * Last item from Section 11 risks addressed here: Store scoping
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as suppliersApi from '@/api/suppliers';
import type { 
  CreateSupplierRequest, 
  UpdateSupplierRequest,
  ListSuppliersRequest 
} from '@/api/suppliers';

// Query keys
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (params: ListSuppliersRequest) => [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
};

// List suppliers
export const useSuppliersQuery = (params: ListSuppliersRequest = {}) => {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => suppliersApi.suppliersApi.listSuppliers(params),
    staleTime: 30000, // 30 seconds
  });
};

// Get supplier by ID
export const useSupplierQuery = (supplierId: string | null) => {
  return useQuery({
    queryKey: supplierKeys.detail(supplierId || ''),
    queryFn: () => suppliersApi.suppliersApi.getSupplier(supplierId!),
    enabled: Boolean(supplierId),
    staleTime: 60000, // 1 minute
  });
};

// Create supplier mutation
export const useCreateSupplierMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => suppliersApi.suppliersApi.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
};

// Update supplier mutation
export const useUpdateSupplierMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ supplierId, data }: { supplierId: string; data: UpdateSupplierRequest }) =>
      suppliersApi.suppliersApi.updateSupplier(supplierId, data),
    onSuccess: (_, { supplierId }) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(supplierId) });
    },
  });
};

// Delete supplier mutation
export const useDeleteSupplierMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (supplierId: string) => suppliersApi.suppliersApi.deleteSupplier(supplierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
};
