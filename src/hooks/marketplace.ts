import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as marketplaceApi from '@/api/marketplace';
import type {
  CreateMarketplaceOrderRequest,
  CreateRfqRequest,
  MarketplaceSearchRequest,
  SupplierOnboardRequest,
} from '@/types/api';

export const useMarketplaceSearchQuery = (params: MarketplaceSearchRequest = {}) =>
  useQuery({ queryKey: ['marketplace', 'search', params], queryFn: () => marketplaceApi.searchCatalog(params), staleTime: 60_000 });

export const useMarketplaceRecommendationsQuery = () =>
  useQuery({ queryKey: ['marketplace', 'recommendations'], queryFn: () => marketplaceApi.getRecommendations(), staleTime: 120_000 });

export const useCreateRfqMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRfqRequest) => marketplaceApi.createRfq(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketplace'] }); },
  });
};

export const useRfqQuery = (rfqId: string) =>
  useQuery({ queryKey: ['marketplace', 'rfq', rfqId], queryFn: () => marketplaceApi.getRfq(rfqId), staleTime: 60_000, enabled: Boolean(rfqId) });

export const useCreateMarketplaceOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMarketplaceOrderRequest) => marketplaceApi.createOrder(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketplace', 'orders'] }); },
  });
};

export const useMarketplaceOrdersQuery = () =>
  useQuery({ queryKey: ['marketplace', 'orders'], queryFn: () => marketplaceApi.listOrders(), staleTime: 60_000 });

export const useMarketplaceOrderQuery = (orderId: string) =>
  useQuery({ queryKey: ['marketplace', 'orders', orderId], queryFn: () => marketplaceApi.getOrder(orderId), staleTime: 60_000, enabled: Boolean(orderId) });

export const useMarketplaceTrackingQuery = (orderId: string) =>
  useQuery({ queryKey: ['marketplace', 'tracking', orderId], queryFn: () => marketplaceApi.trackOrder(orderId), staleTime: 30_000, enabled: Boolean(orderId) });

export const useSupplierDashboardQuery = (supplierId: number | string) =>
  useQuery({ queryKey: ['marketplace', 'supplier-dashboard', supplierId], queryFn: () => marketplaceApi.getSupplierDashboard(supplierId), staleTime: 120_000, enabled: Boolean(supplierId) });

export const useSupplierCatalogQuery = (supplierId: number | string) =>
  useQuery({ queryKey: ['marketplace', 'supplier-catalog', supplierId], queryFn: () => marketplaceApi.getSupplierCatalog(supplierId), staleTime: 120_000, enabled: Boolean(supplierId) });

export const useSupplierOnboardMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierOnboardRequest) => marketplaceApi.onboardSupplier(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['marketplace'] }); },
  });
};
