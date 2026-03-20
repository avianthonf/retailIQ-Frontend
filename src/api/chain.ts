/**
 * src/api/chain.ts
 * Chain Management API
 * Multi-store operations for chain owners
 */
import { apiClient } from './client';

// Chain types
export interface ChainGroup {
  chain_id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  member_stores: ChainStore[];
}

export interface ChainStore {
  store_id: string;
  chain_id: string;
  store_name: string;
  joined_at: string;
  is_active: boolean;
}

export interface CreateChainGroupRequest {
  name: string;
  description?: string;
}

export interface AddStoreRequest {
  store_id: string;
}

export interface ChainDashboard {
  chain_id: string;
  total_stores: number;
  total_revenue: number;
  total_transactions: number;
  top_performing_stores: StorePerformance[];
  recent_transfers: StockTransfer[];
}

export interface StorePerformance {
  store_id: string;
  store_name: string;
  revenue: number;
  transactions: number;
  growth_rate: number;
}

export interface StockTransfer {
  transfer_id: string;
  from_store_id: string;
  to_store_id: string;
  product_id: string;
  quantity: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface TransferSuggestion {
  from_store_id: string;
  to_store_id: string;
  product_id: string;
  product_name: string;
  suggested_quantity: number;
  reason: 'OVERSTOCK' | 'STOCKOUT' | 'OPTIMIZATION';
}

export interface CreateTransferRequest {
  from_store_id: string;
  to_store_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
}

export interface ChainComparison {
  chain_id: string;
  comparison_period: string;
  metrics: {
    revenue: StoreMetric[];
    transactions: StoreMetric[];
    inventory: StoreMetric[];
    customers: StoreMetric[];
  };
}

export interface StoreMetric {
  store_id: string;
  store_name: string;
  value: number;
  change_percentage: number;
}

// Chain API
export const chainApi = {
  // Chain Group Management
  createGroup: async (data: CreateChainGroupRequest): Promise<ChainGroup> => {
    const response = await apiClient.post('/chain/groups', data);
    return response.data;
  },

  getGroup: async (chainId: string): Promise<ChainGroup> => {
    const response = await apiClient.get(`/chain/groups/${chainId}`);
    return response.data;
  },

  updateGroup: async (chainId: string, data: Partial<CreateChainGroupRequest>): Promise<ChainGroup> => {
    const response = await apiClient.put(`/chain/groups/${chainId}`, data);
    return response.data;
  },

  // Store Management
  addStore: async (chainId: string, data: AddStoreRequest): Promise<ChainStore> => {
    const response = await apiClient.post(`/chain/groups/${chainId}/stores`, data);
    return response.data;
  },

  removeStore: async (chainId: string, storeId: string): Promise<void> => {
    await apiClient.delete(`/chain/groups/${chainId}/stores/${storeId}`);
  },

  // Dashboard and Analytics
  getDashboard: async (chainId: string): Promise<ChainDashboard> => {
    const response = await apiClient.get(`/chain/groups/${chainId}/dashboard`);
    return response.data;
  },

  getComparison: async (chainId: string, period: string): Promise<ChainComparison> => {
    const response = await apiClient.get(`/chain/groups/${chainId}/comparison`, {
      params: { period }
    });
    return response.data;
  },

  // Stock Transfers
  getTransferSuggestions: async (chainId: string): Promise<TransferSuggestion[]> => {
    const response = await apiClient.get(`/chain/groups/${chainId}/transfer-suggestions`);
    return response.data;
  },

  createTransfer: async (chainId: string, data: CreateTransferRequest): Promise<StockTransfer> => {
    const response = await apiClient.post(`/chain/groups/${chainId}/transfers`, data);
    return response.data;
  },

  getTransfers: async (chainId: string): Promise<StockTransfer[]> => {
    const response = await apiClient.get(`/chain/groups/${chainId}/transfers`);
    return response.data;
  },

  updateTransferStatus: async (chainId: string, transferId: string, status: StockTransfer['status']): Promise<StockTransfer> => {
    const response = await apiClient.patch(`/chain/groups/${chainId}/transfers/${transferId}`, { status });
    return response.data;
  },
};
