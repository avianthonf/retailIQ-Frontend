/**
 * src/hooks/purchaseOrders.ts
 * Oracle Document sections consumed: 3.2, 5.2
 * Last item from Section 11 risks addressed here: Store scoping, PO status tracking
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as purchaseOrdersApi from '@/api/purchaseOrders';
import type { 
  CreatePurchaseOrderRequest, 
  UpdatePurchaseOrderRequest,
  ReceivePurchaseOrderRequest,
  ListPurchaseOrdersRequest,
  PurchaseOrderStatus 
} from '@/api/purchaseOrders';

// Query keys
export const purchaseOrderKeys = {
  all: ['purchaseOrders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (params: ListPurchaseOrdersRequest) => [...purchaseOrderKeys.lists(), params] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...purchaseOrderKeys.details(), id] as const,
  summary: () => [...purchaseOrderKeys.all, 'summary'] as const,
};

// List purchase orders
export const usePurchaseOrdersQuery = (params: ListPurchaseOrdersRequest = {}) => {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => purchaseOrdersApi.purchaseOrdersApi.listPurchaseOrders(params),
    staleTime: 30000, // 30 seconds
  });
};

// Get purchase order by ID
export const usePurchaseOrderQuery = (purchaseOrderId: string | null) => {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(purchaseOrderId || ''),
    queryFn: () => purchaseOrdersApi.purchaseOrdersApi.getPurchaseOrder(purchaseOrderId!),
    enabled: Boolean(purchaseOrderId),
    staleTime: 60000, // 1 minute
  });
};

// Get purchase order summary
export const usePurchaseOrderSummaryQuery = () => {
  return useQuery({
    queryKey: purchaseOrderKeys.summary(),
    queryFn: () => purchaseOrdersApi.purchaseOrdersApi.getPurchaseOrderSummary(),
    staleTime: 60000, // 1 minute
  });
};

// Create purchase order mutation
export const useCreatePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) => purchaseOrdersApi.purchaseOrdersApi.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() });
    },
  });
};

// Update purchase order mutation
export const useUpdatePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ purchaseOrderId, data }: { purchaseOrderId: string; data: UpdatePurchaseOrderRequest }) =>
      purchaseOrdersApi.purchaseOrdersApi.updatePurchaseOrder(purchaseOrderId, data),
    onSuccess: (_, { purchaseOrderId }) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(purchaseOrderId) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() });
    },
  });
};

// Delete purchase order mutation
export const useDeletePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (purchaseOrderId: string) => purchaseOrdersApi.purchaseOrdersApi.deletePurchaseOrder(purchaseOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() });
    },
  });
};

// Send purchase order mutation
export const useSendPurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (purchaseOrderId: string) => purchaseOrdersApi.purchaseOrdersApi.sendPurchaseOrder(purchaseOrderId),
    onSuccess: (_, purchaseOrderId) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(purchaseOrderId) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() });
    },
  });
};

// Confirm purchase order mutation
export const useConfirmPurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (purchaseOrderId: string) => purchaseOrdersApi.purchaseOrdersApi.confirmPurchaseOrder(purchaseOrderId),
    onSuccess: (_, purchaseOrderId) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(purchaseOrderId) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() });
    },
  });
};

// Receive purchase order mutation
export const useReceivePurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ purchaseOrderId, data }: { purchaseOrderId: string; data: ReceivePurchaseOrderRequest }) =>
      purchaseOrdersApi.purchaseOrdersApi.receivePurchaseOrder(purchaseOrderId, data),
    onSuccess: (_, { purchaseOrderId }) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(purchaseOrderId) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() });
    },
  });
};

// Cancel purchase order mutation
export const useCancelPurchaseOrderMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ purchaseOrderId, reason }: { purchaseOrderId: string; reason?: string }) =>
      purchaseOrdersApi.purchaseOrdersApi.cancelPurchaseOrder(purchaseOrderId, reason),
    onSuccess: (_, { purchaseOrderId }) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(purchaseOrderId) });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.summary() });
    },
  });
};

// Generate PDF mutation
export const useGeneratePdfMutation = () => {
  return useMutation({
    mutationFn: (purchaseOrderId: string) => purchaseOrdersApi.purchaseOrdersApi.generatePdf(purchaseOrderId),
  });
};

// Email purchase order mutation
export const useEmailPurchaseOrderMutation = () => {
  return useMutation({
    mutationFn: ({ purchaseOrderId, email }: { purchaseOrderId: string; email: string }) =>
      purchaseOrdersApi.purchaseOrdersApi.emailPurchaseOrder(purchaseOrderId, email),
  });
};

// Helper functions
export const getPurchaseOrderStatusColor = (status: PurchaseOrderStatus): string => {
  switch (status) {
    case 'DRAFT':
      return 'gray';
    case 'SENT':
      return 'blue';
    case 'CONFIRMED':
      return 'indigo';
    case 'PARTIALLY_RECEIVED':
      return 'yellow';
    case 'RECEIVED':
      return 'green';
    case 'CANCELLED':
      return 'red';
    case 'REJECTED':
      return 'red';
    default:
      return 'gray';
  }
};

export const getPurchaseOrderStatusText = (status: PurchaseOrderStatus): string => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'SENT':
      return 'Sent to Supplier';
    case 'CONFIRMED':
      return 'Confirmed';
    case 'PARTIALLY_RECEIVED':
      return 'Partially Received';
    case 'RECEIVED':
      return 'Received';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
};

export const canEditPurchaseOrder = (_status: PurchaseOrderStatus): boolean => {
  return _status === 'DRAFT';
};

export const canDeletePurchaseOrder = (status: PurchaseOrderStatus): boolean => {
  return status === 'DRAFT';
};

export const canSendPurchaseOrder = (status: PurchaseOrderStatus): boolean => {
  return status === 'DRAFT';
};

export const canConfirmPurchaseOrder = (_status: PurchaseOrderStatus): boolean => {
  return _status === 'SENT';
};

export const canReceivePurchaseOrder = (status: PurchaseOrderStatus): boolean => {
  return status === 'SENT' || status === 'PARTIALLY_RECEIVED';
};

export const canCancelPurchaseOrder = (status: PurchaseOrderStatus): boolean => {
  return !['RECEIVED', 'CANCELLED', 'REJECTED'].includes(status);
};
