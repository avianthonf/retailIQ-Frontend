/**
 * src/api/chain.ts
 * Backend-aligned chain adapters
 */
import { request } from './client';

const CHAIN_BASE = '/api/v1/chain';

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

interface RawChainDashboard {
  total_revenue_today?: number;
  total_open_alerts?: number;
  per_store_today?: Array<{
    store_id?: string;
    name?: string;
    revenue?: number;
    transaction_count?: number;
  }>;
  transfer_suggestions?: Array<{
    id?: string;
    from_store?: string;
    to_store?: string;
    product?: string;
    qty?: number;
    reason?: string;
  }>;
}

interface RawChainGroup {
  group_id?: string;
  name?: string;
  description?: string;
  owner_user_id?: string | number;
  created_at?: string;
  updated_at?: string;
  member_store_ids?: Array<string | number>;
}

interface RawTransfer {
  id?: string;
  from_store?: string;
  to_store?: string;
  product?: string;
  qty?: number;
  status?: string;
  reason?: string;
  created_at?: string;
}

const nowIso = () => new Date().toISOString();

const mapReason = (reason?: string): TransferSuggestion['reason'] => {
  switch (reason) {
    case 'STOCKOUT':
      return 'STOCKOUT';
    case 'OVERSTOCK':
      return 'OVERSTOCK';
    default:
      return 'OPTIMIZATION';
  }
};

const mapTransferStatus = (status?: string): StockTransfer['status'] => {
  switch (status) {
    case 'ACTIONED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'IN_TRANSIT':
      return 'IN_TRANSIT';
    default:
      return 'PENDING';
  }
};

const getDashboardRaw = () => request<RawChainDashboard>({ url: `${CHAIN_BASE}/dashboard`, method: 'GET' });

const mapStoresFromDashboard = (chainId: string, dashboard: RawChainDashboard): ChainStore[] =>
  Array.isArray(dashboard.per_store_today)
    ? dashboard.per_store_today.map((store) => ({
        store_id: String(store.store_id ?? ''),
        chain_id: chainId,
        store_name: store.name ?? `Store ${store.store_id ?? ''}`,
        joined_at: nowIso(),
        is_active: true,
      }))
    : [];

const mapSuggestions = (dashboard: RawChainDashboard): TransferSuggestion[] =>
  Array.isArray(dashboard.transfer_suggestions)
    ? dashboard.transfer_suggestions.map((suggestion) => ({
        from_store_id: String(suggestion.from_store ?? ''),
        to_store_id: String(suggestion.to_store ?? ''),
        product_id: String(suggestion.product ?? ''),
        product_name: String(suggestion.product ?? ''),
        suggested_quantity: Number(suggestion.qty ?? 0),
        reason: mapReason(suggestion.reason),
      }))
    : [];

export const chainApi = {
  createGroup: async (data: CreateChainGroupRequest): Promise<ChainGroup> => {
    const response = await request<{ group_id?: string; name?: string }>({
      url: `${CHAIN_BASE}/groups`,
      method: 'POST',
      data,
    });

    const chainId = String(response.group_id ?? '');
    return {
      chain_id: chainId,
      name: response.name ?? data.name,
      description: data.description,
      owner_id: '',
      created_at: nowIso(),
      updated_at: nowIso(),
      member_stores: [],
    };
  },

  getGroup: async (chainId: string): Promise<ChainGroup> => {
    const [group, dashboard] = await Promise.all([
      request<RawChainGroup>({
        url: `${CHAIN_BASE}/groups/${chainId}`,
        method: 'GET',
      }),
      getDashboardRaw(),
    ]);
    const storeLookup = new Map(
      (dashboard.per_store_today ?? []).map((store) => [String(store.store_id ?? ''), store]),
    );

    return {
      chain_id: String(group.group_id ?? chainId),
      name: group.name ?? `Chain ${chainId.slice(0, 8)}`,
      description: group.description ?? undefined,
      owner_id: String(group.owner_user_id ?? ''),
      created_at: group.created_at ?? nowIso(),
      updated_at: group.updated_at ?? nowIso(),
      member_stores: Array.isArray(group.member_store_ids)
        ? group.member_store_ids.map((storeId) => {
            const dashboardStore = storeLookup.get(String(storeId));
            return {
              store_id: String(storeId),
              chain_id: chainId,
              store_name: dashboardStore?.name ?? `Store ${storeId}`,
              joined_at: group.created_at ?? nowIso(),
              is_active: true,
            };
          })
        : mapStoresFromDashboard(chainId, dashboard),
    };
  },

  updateGroup: async (chainId: string, data: Partial<CreateChainGroupRequest>): Promise<ChainGroup> => {
    await request<RawChainGroup>({
      url: `${CHAIN_BASE}/groups/${chainId}`,
      method: 'PATCH',
      data,
    });
    return chainApi.getGroup(chainId);
  },

  addStore: async (chainId: string, data: AddStoreRequest): Promise<ChainStore> => {
    await request<{ membership_id?: string }>({
      url: `${CHAIN_BASE}/groups/${chainId}/stores`,
      method: 'POST',
      data,
    });

    return {
      store_id: data.store_id,
      chain_id: chainId,
      store_name: data.store_id,
      joined_at: nowIso(),
      is_active: true,
    };
  },

  removeStore: async (chainId: string, storeId: string): Promise<void> => {
    await request<{ store_id: string; removed: boolean }>({
      url: `${CHAIN_BASE}/groups/${chainId}/stores/${storeId}`,
      method: 'DELETE',
    });
  },

  getDashboard: async (chainId: string): Promise<ChainDashboard> => {
    const dashboard = await getDashboardRaw();
    const stores = Array.isArray(dashboard.per_store_today) ? dashboard.per_store_today : [];
    const topStores = [...stores]
      .sort((left, right) => Number(right.revenue ?? 0) - Number(left.revenue ?? 0))
      .map((store) => ({
        store_id: String(store.store_id ?? ''),
        store_name: store.name ?? `Store ${store.store_id ?? ''}`,
        revenue: Number(store.revenue ?? 0),
        transactions: Number(store.transaction_count ?? 0),
        growth_rate: 0,
      }));

    return {
      chain_id: chainId,
      total_stores: stores.length,
      total_revenue: Number(dashboard.total_revenue_today ?? 0),
      total_transactions: stores.reduce((sum, store) => sum + Number(store.transaction_count ?? 0), 0),
      top_performing_stores: topStores,
      recent_transfers: await chainApi.getTransfers(chainId),
    };
  },

  getComparison: async (chainId: string, period: string): Promise<ChainComparison> => {
    const response = await request<Array<{ store_id?: string; revenue?: number; relative_to_avg?: string }>>({
      url: `${CHAIN_BASE}/compare`,
      method: 'GET',
      params: { period },
    });

    const revenueMetrics = Array.isArray(response)
      ? response.map((row) => ({
          store_id: String(row.store_id ?? ''),
          store_name: `Store ${row.store_id ?? ''}`,
          value: Number(row.revenue ?? 0),
          change_percentage: row.relative_to_avg === 'above' ? 5 : row.relative_to_avg === 'below' ? -5 : 0,
        }))
      : [];

    return {
      chain_id: chainId,
      comparison_period: period,
      metrics: {
        revenue: revenueMetrics,
        transactions: [],
        inventory: [],
        customers: [],
      },
    };
  },

  getTransferSuggestions: async (_chainId: string): Promise<TransferSuggestion[]> => {
    const dashboard = await getDashboardRaw();
    return mapSuggestions(dashboard);
  },

  createTransfer: async (_chainId: string, data: CreateTransferRequest): Promise<StockTransfer> => {
    const response = await request<RawTransfer>({
      url: `${CHAIN_BASE}/transfers`,
      method: 'POST',
      data: {
        from_store_id: data.from_store_id,
        to_store_id: data.to_store_id,
        product_id: data.product_id,
        quantity: data.quantity,
        notes: data.notes,
      },
    });

    return {
      transfer_id: String(response.id ?? ''),
      from_store_id: String(response.from_store ?? data.from_store_id),
      to_store_id: String(response.to_store ?? data.to_store_id),
      product_id: String(response.product ?? data.product_id),
      quantity: Number(response.qty ?? data.quantity),
      status: mapTransferStatus(response.status),
      created_at: response.created_at ?? nowIso(),
    };
  },

  getTransfers: async (_chainId: string): Promise<StockTransfer[]> => {
    const response = await request<RawTransfer[]>({
      url: `${CHAIN_BASE}/transfers`,
      method: 'GET',
    });

    return Array.isArray(response)
      ? response.map((transfer) => ({
          transfer_id: String(transfer.id ?? ''),
          from_store_id: String(transfer.from_store ?? ''),
          to_store_id: String(transfer.to_store ?? ''),
          product_id: String(transfer.product ?? ''),
          quantity: Number(transfer.qty ?? 0),
          status: mapTransferStatus(transfer.status),
          created_at: transfer.created_at ?? nowIso(),
        }))
      : [];
  },

  updateTransferStatus: async (_chainId: string, transferId: string, status: StockTransfer['status']): Promise<StockTransfer> => {
    if (status !== 'COMPLETED') {
      throw new Error('The backend currently supports confirming transfers only.');
    }

    await request<{ id?: string }>({
      url: `${CHAIN_BASE}/transfers/${transferId}/confirm`,
      method: 'POST',
    });

    return {
      transfer_id: transferId,
      from_store_id: '',
      to_store_id: '',
      product_id: '',
      quantity: 0,
      status: 'COMPLETED',
      created_at: nowIso(),
    };
  },
};
