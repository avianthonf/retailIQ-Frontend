/**
 * src/api/loyalty.ts
 * Backend-aligned loyalty adapters
 */
import { normalizeApiError } from '@/utils/errors';
import { request } from './client';

const LOYALTY_BASE = '/api/v1/loyalty';

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  points_per_currency: number;
  redemption_rate: number;
  min_redemption_points: number;
  max_points_per_transaction: number;
  expiry_months: number;
  tiers: LoyaltyTier[];
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  description: string;
  min_points: number;
  max_points?: number;
  benefits: string[];
  multiplier: number;
  created_at: string;
}

export interface LoyaltyAccount {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  program_id: string;
  tier_id: string;
  tier_name: string;
  current_points: number;
  lifetime_points: number;
  points_earned: number;
  points_redeemed: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  account_id: string;
  customer_id: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';
  points: number;
  reference_id?: string;
  reference_type?: string;
  description: string;
  balance_after: number;
  expires_at?: string;
  created_at: string;
}

export interface RedemptionRequest {
  customer_id: string;
  points: number;
  description?: string;
  reference_id?: string;
}

export interface RedemptionResponse {
  transaction_id: string;
  points_redeemed: number;
  currency_value: number;
  new_balance: number;
}

export interface LoyaltyAnalytics {
  total_customers: number;
  active_customers: number;
  total_points_issued: number;
  total_points_redeemed: number;
  points_expiry_next_month: number;
  top_customers: {
    customer_id: string;
    customer_name: string;
    points: number;
    tier: string;
  }[];
  tier_distribution: {
    tier_name: string;
    customer_count: number;
    percentage: number;
  }[];
  monthly_trends: {
    month: string;
    points_earned: number;
    points_redeemed: number;
    new_customers: number;
  }[];
}

export interface PointsAdjustmentRequest {
  customer_id: string;
  points: number;
  reason: string;
  expires_at?: string;
}

interface RawProgram {
  points_per_rupee?: number;
  redemption_rate?: number;
  min_redemption_points?: number;
  expiry_days?: number;
  is_active?: boolean;
  tiers?: Array<{
    id?: string;
    name?: string;
    description?: string;
    min_points?: number;
    max_points?: number | null;
    benefits?: string[];
    multiplier?: number;
    created_at?: string;
  }>;
}

interface RawAccount {
  id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  program_id?: string;
  tier_id?: string;
  tier_name?: string;
  total_points?: number;
  redeemable_points?: number;
  lifetime_earned?: number;
  last_activity_at?: string | null;
  created_at?: string;
  updated_at?: string;
  recent_transactions?: Array<{
    id?: string;
    type?: string;
    points?: number;
    balance_after?: number;
    created_at?: string;
    notes?: string;
  }>;
}

const nowIso = () => new Date().toISOString();

const defaultTier = (): LoyaltyTier => ({
  id: 'default',
  name: 'Base',
  description: 'Default loyalty tier',
  min_points: 0,
  max_points: undefined,
  benefits: [],
  multiplier: 1,
  created_at: nowIso(),
});

const defaultProgram = (): LoyaltyProgram => ({
  id: 'default',
  name: 'RetailIQ Rewards',
  description: 'Store loyalty program',
  is_active: false,
  points_per_currency: 0,
  redemption_rate: 0,
  min_redemption_points: 0,
  max_points_per_transaction: 0,
  expiry_months: 0,
  tiers: [defaultTier()],
  created_at: nowIso(),
  updated_at: nowIso(),
});

const mapTier = (tier: NonNullable<RawProgram['tiers']>[number]): LoyaltyTier => ({
  id: String(tier.id ?? ''),
  name: tier.name ?? 'Base',
  description: tier.description ?? '',
  min_points: Number(tier.min_points ?? 0),
  max_points: tier.max_points === null || tier.max_points === undefined ? undefined : Number(tier.max_points),
  benefits: Array.isArray(tier.benefits) ? tier.benefits : [],
  multiplier: Number(tier.multiplier ?? 1),
  created_at: tier.created_at ?? nowIso(),
});

const mapProgram = (program: RawProgram): LoyaltyProgram => ({
  ...defaultProgram(),
  is_active: Boolean(program.is_active),
  points_per_currency: Number(program.points_per_rupee ?? 0),
  redemption_rate: Number(program.redemption_rate ?? 0),
  min_redemption_points: Number(program.min_redemption_points ?? 0),
  expiry_months: Math.round(Number(program.expiry_days ?? 0) / 30),
  tiers: Array.isArray(program.tiers) && program.tiers.length ? program.tiers.map(mapTier) : [defaultTier()],
});

const mapAccount = (customerId: string, account: RawAccount): LoyaltyAccount => ({
  id: String(account.id ?? customerId),
  customer_id: String(account.customer_id ?? customerId),
  customer_name: account.customer_name ?? `Customer ${customerId}`,
  customer_phone: account.customer_phone ?? '',
  customer_email: account.customer_email ?? undefined,
  program_id: account.program_id ?? 'default',
  tier_id: account.tier_id ?? 'default',
  tier_name: account.tier_name ?? 'Base',
  current_points: Number(account.total_points ?? 0),
  lifetime_points: Number(account.lifetime_earned ?? 0),
  points_earned: Number(account.lifetime_earned ?? 0),
  points_redeemed: Math.max(0, Number(account.lifetime_earned ?? 0) - Number(account.total_points ?? 0)),
  last_activity_at: account.last_activity_at ?? nowIso(),
  created_at: account.created_at ?? account.last_activity_at ?? nowIso(),
  updated_at: account.updated_at ?? account.last_activity_at ?? nowIso(),
});

const mapTransactionType = (type?: string): LoyaltyTransaction['type'] => {
  switch (type) {
    case 'REDEEM':
      return 'REDEEMED';
    case 'EXPIRE':
      return 'EXPIRED';
    case 'ADJUST':
      return 'ADJUSTED';
    default:
      return 'EARNED';
  }
};

export const loyaltyApi = {
  getProgram: async (): Promise<LoyaltyProgram> => {
    try {
      const response = await request<RawProgram>({ url: `${LOYALTY_BASE}/program`, method: 'GET' });
      return mapProgram(response);
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 404) {
        return defaultProgram();
      }
      throw error;
    }
  },

  updateProgram: async (data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> => {
    await request<{ message?: string }>({
      url: `${LOYALTY_BASE}/program`,
      method: 'PUT',
      data: {
        points_per_rupee: data.points_per_currency,
        redemption_rate: data.redemption_rate,
        min_redemption_points: data.min_redemption_points,
        expiry_days: data.expiry_months ? data.expiry_months * 30 : undefined,
        is_active: data.is_active,
      },
    });

    return loyaltyApi.getProgram();
  },

  createTier: async (data: Omit<LoyaltyTier, 'id' | 'created_at'>): Promise<LoyaltyTier> => {
    const response = await request<NonNullable<RawProgram['tiers']>[number]>({
      url: `${LOYALTY_BASE}/tiers`,
      method: 'POST',
      data,
    });
    return mapTier(response);
  },

  updateTier: async (id: string, data: Partial<LoyaltyTier>): Promise<LoyaltyTier> => {
    const response = await request<NonNullable<RawProgram['tiers']>[number]>({
      url: `${LOYALTY_BASE}/tiers/${id}`,
      method: 'PATCH',
      data,
    });
    return mapTier(response);
  },

  deleteTier: async (id: string): Promise<void> => {
    await request<{ id: string; deleted: boolean }>({
      url: `${LOYALTY_BASE}/tiers/${id}`,
      method: 'DELETE',
    });
  },

  getAccount: async (customerId: string): Promise<LoyaltyAccount> => {
    const response = await request<RawAccount>({ url: `${LOYALTY_BASE}/customers/${customerId}`, method: 'GET' });
    return mapAccount(customerId, response);
  },

  searchAccounts: async (params?: {
    query?: string;
    tier_id?: string;
    min_points?: number;
    max_points?: number;
    page?: number;
    limit?: number;
  }): Promise<{ accounts: LoyaltyAccount[]; total: number; page: number; pages: number }> => {
    const query = params?.query?.trim();
    if (!query || !/^\d+$/.test(query)) {
      return { accounts: [], total: 0, page: params?.page ?? 1, pages: 0 };
    }

    try {
      const account = await loyaltyApi.getAccount(query);
      return { accounts: [account], total: 1, page: 1, pages: 1 };
    } catch {
      return { accounts: [], total: 0, page: params?.page ?? 1, pages: 0 };
    }
  },

  getTransactions: async (customerId: string, params?: {
    type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: LoyaltyTransaction[]; total: number; page: number; pages: number }> => {
    const response = await request<Array<{ id?: string; type?: string; points?: number; balance_after?: number; created_at?: string; notes?: string }>>({
      url: `${LOYALTY_BASE}/customers/${customerId}/transactions`,
      method: 'GET',
      params,
    });

    const transactions = Array.isArray(response)
      ? response.map((transaction) => ({
          id: String(transaction.id ?? ''),
          account_id: customerId,
          customer_id: customerId,
          type: mapTransactionType(transaction.type),
          points: Number(transaction.points ?? 0),
          description: transaction.notes ?? '',
          balance_after: Number(transaction.balance_after ?? 0),
          created_at: transaction.created_at ?? nowIso(),
        }))
      : [];

    return {
      transactions,
      total: transactions.length,
      page: params?.page ?? 1,
      pages: transactions.length ? 1 : 0,
    };
  },

  redeemPoints: async (data: RedemptionRequest): Promise<RedemptionResponse> => {
    const response = await request<{ remaining_points?: number }>({
      url: `${LOYALTY_BASE}/customers/${data.customer_id}/redeem`,
      method: 'POST',
      data: {
        points_to_redeem: data.points,
        transaction_id: data.reference_id,
      },
    });

    return {
      transaction_id: data.reference_id ?? `redeem-${Date.now()}`,
      points_redeemed: data.points,
      currency_value: 0,
      new_balance: Number(response.remaining_points ?? 0),
    };
  },

  adjustPoints: async (data: PointsAdjustmentRequest): Promise<LoyaltyTransaction> => {
    const response = await request<{
      id?: string;
      type?: string;
      points?: number;
      balance_after?: number;
      description?: string;
      created_at?: string;
    }>({
      url: `${LOYALTY_BASE}/customers/${data.customer_id}/adjust`,
      method: 'POST',
      data,
    });
    return {
      id: String(response.id ?? ''),
      account_id: data.customer_id,
      customer_id: data.customer_id,
      type: mapTransactionType(response.type),
      points: Number(response.points ?? data.points),
      description: response.description ?? data.reason,
      balance_after: Number(response.balance_after ?? 0),
      created_at: response.created_at ?? nowIso(),
    };
  },

  getAnalytics: async (_params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<LoyaltyAnalytics> => {
    const response = await request<{
      enrolled_customers?: number;
      points_issued_this_month?: number;
      points_redeemed_this_month?: number;
      redemption_rate_this_month?: number;
      top_customers?: Array<{
        customer_id?: string;
        customer_name?: string;
        points?: number;
        tier?: string;
      }>;
      tier_distribution?: Array<{
        tier_name?: string;
        customer_count?: number;
        percentage?: number;
      }>;
      monthly_trends?: Array<{
        month?: string;
        points_earned?: number;
        points_redeemed?: number;
        new_customers?: number;
      }>;
    }>({
      url: `${LOYALTY_BASE}/analytics`,
      method: 'GET',
    });

    return {
      total_customers: Number(response.enrolled_customers ?? 0),
      active_customers: Number(response.enrolled_customers ?? 0),
      total_points_issued: Number(response.points_issued_this_month ?? 0),
      total_points_redeemed: Number(response.points_redeemed_this_month ?? 0),
      points_expiry_next_month: 0,
      top_customers: Array.isArray(response.top_customers)
        ? response.top_customers.map((customer) => ({
            customer_id: String(customer.customer_id ?? ''),
            customer_name: customer.customer_name ?? 'Customer',
            points: Number(customer.points ?? 0),
            tier: customer.tier ?? 'Base',
          }))
        : [],
      tier_distribution: Array.isArray(response.tier_distribution)
        ? response.tier_distribution.map((tier) => ({
            tier_name: tier.tier_name ?? 'Base',
            customer_count: Number(tier.customer_count ?? 0),
            percentage: Number(tier.percentage ?? 0),
          }))
        : [],
      monthly_trends: Array.isArray(response.monthly_trends)
        ? response.monthly_trends.map((trend) => ({
            month: trend.month ?? '',
            points_earned: Number(trend.points_earned ?? 0),
            points_redeemed: Number(trend.points_redeemed ?? 0),
            new_customers: Number(trend.new_customers ?? 0),
          }))
        : [],
    };
  },

  bulkAdjustPoints: async (adjustments: PointsAdjustmentRequest[]): Promise<{
    successful: { customer_id: string; transaction: LoyaltyTransaction }[];
    failed: { customer_id: string; error: string }[];
  }> => {
    const response = await request<{
      successful?: Array<{
        customer_id?: string;
        transaction?: {
          id?: string;
          type?: string;
          points?: number;
          balance_after?: number;
        };
      }>;
      failed?: Array<{ customer_id?: string; error?: string }>;
    }>({
      url: `${LOYALTY_BASE}/customers/adjustments/bulk`,
      method: 'POST',
      data: { adjustments },
    });

    return {
      successful: Array.isArray(response.successful)
        ? response.successful.map((item) => ({
            customer_id: String(item.customer_id ?? ''),
            transaction: {
              id: String(item.transaction?.id ?? ''),
              account_id: String(item.customer_id ?? ''),
              customer_id: String(item.customer_id ?? ''),
              type: mapTransactionType(item.transaction?.type),
              points: Number(item.transaction?.points ?? 0),
              description: 'Bulk adjustment',
              balance_after: Number(item.transaction?.balance_after ?? 0),
              created_at: nowIso(),
            },
          }))
        : [],
      failed: Array.isArray(response.failed)
        ? response.failed.map((item) => ({
            customer_id: String(item.customer_id ?? ''),
            error: item.error ?? 'Adjustment failed',
          }))
        : [],
    };
  },

  getExpiringPoints: async (days: number = 30): Promise<{
    customer_id: string;
    customer_name: string;
    points: number;
    expires_at: string;
  }[]> =>
    request<Array<{
      customer_id?: string;
      customer_name?: string;
      points?: number;
      expires_at?: string;
    }>>({
      url: `${LOYALTY_BASE}/expiring-points`,
      method: 'GET',
      params: { days },
    }).then((response) =>
      Array.isArray(response)
        ? response.map((item) => ({
            customer_id: String(item.customer_id ?? ''),
            customer_name: item.customer_name ?? 'Customer',
            points: Number(item.points ?? 0),
            expires_at: item.expires_at ?? nowIso(),
          }))
        : [],
    ),

  enrollCustomer: async (customerId: string): Promise<LoyaltyAccount> => {
    const response = await request<RawAccount>({
      url: `${LOYALTY_BASE}/customers/${customerId}/enroll`,
      method: 'POST',
    });
    return mapAccount(customerId, response);
  },

  updateCustomerTier: async (customerId: string, tierId: string): Promise<LoyaltyAccount> => {
    const response = await request<RawAccount>({
      url: `${LOYALTY_BASE}/customers/${customerId}/tier`,
      method: 'PUT',
      data: { tier_id: tierId },
    });
    return mapAccount(customerId, response);
  },
};
