/**
 * src/api/loyalty.ts
 * Loyalty Program API
 */
import { apiClient } from './client';

// Loyalty types
export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  points_per_currency: number; // points earned per currency unit spent
  redemption_rate: number; // currency value per point
  min_redemption_points: number;
  max_points_per_transaction: number;
  expiry_months: number; // points expire after X months
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
  multiplier: number; // points earning multiplier
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
  reference_id?: string; // transaction_id or invoice_id
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
  points: number; // positive to add, negative to subtract
  reason: string;
  expires_at?: string;
}

// Loyalty API
export const loyaltyApi = {
  // Program Management
  getProgram: async (): Promise<LoyaltyProgram> => {
    const response = await apiClient.get('/loyalty/program');
    return response.data;
  },

  updateProgram: async (data: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> => {
    const response = await apiClient.put('/loyalty/program', data);
    return response.data;
  },

  // Tier Management
  createTier: async (data: Omit<LoyaltyTier, 'id' | 'created_at'>): Promise<LoyaltyTier> => {
    const response = await apiClient.post('/loyalty/tiers', data);
    return response.data;
  },

  updateTier: async (id: string, data: Partial<LoyaltyTier>): Promise<LoyaltyTier> => {
    const response = await apiClient.put(`/loyalty/tiers/${id}`, data);
    return response.data;
  },

  deleteTier: async (id: string): Promise<void> => {
    await apiClient.delete(`/loyalty/tiers/${id}`);
  },

  // Customer Accounts
  getAccount: async (customerId: string): Promise<LoyaltyAccount> => {
    const response = await apiClient.get(`/loyalty/accounts/${customerId}`);
    return response.data;
  },

  searchAccounts: async (params?: {
    query?: string;
    tier_id?: string;
    min_points?: number;
    max_points?: number;
    page?: number;
    limit?: number;
  }): Promise<{ accounts: LoyaltyAccount[]; total: number; page: number; pages: number }> => {
    const response = await apiClient.get('/loyalty/accounts', { params });
    return response.data;
  },

  // Transactions
  getTransactions: async (customerId: string, params?: {
    type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: LoyaltyTransaction[]; total: number; page: number; pages: number }> => {
    const response = await apiClient.get(`/loyalty/accounts/${customerId}/transactions`, { params });
    return response.data;
  },

  // Points Operations
  redeemPoints: async (data: RedemptionRequest): Promise<RedemptionResponse> => {
    const response = await apiClient.post('/loyalty/redeem', data);
    return response.data;
  },

  adjustPoints: async (data: PointsAdjustmentRequest): Promise<LoyaltyTransaction> => {
    const response = await apiClient.post('/loyalty/adjust', data);
    return response.data;
  },

  // Analytics
  getAnalytics: async (params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<LoyaltyAnalytics> => {
    const response = await apiClient.get('/loyalty/analytics', { params });
    return response.data;
  },

  // Bulk Operations
  bulkAdjustPoints: async (adjustments: PointsAdjustmentRequest[]): Promise<{
    successful: { customer_id: string; transaction: LoyaltyTransaction }[];
    failed: { customer_id: string; error: string }[];
  }> => {
    const response = await apiClient.post('/loyalty/bulk-adjust', { adjustments });
    return response.data;
  },

  // Expiry Management
  getExpiringPoints: async (days: number = 30): Promise<{
    customer_id: string;
    customer_name: string;
    points: number;
    expires_at: string;
  }[]> => {
    const response = await apiClient.get('/loyalty/expiring', { params: { days } });
    return response.data;
  },

  // Customer Enrollment
  enrollCustomer: async (customerId: string): Promise<LoyaltyAccount> => {
    const response = await apiClient.post('/loyalty/enroll', { customer_id: customerId });
    return response.data;
  },

  // Tier Management for Customers
  updateCustomerTier: async (customerId: string, tierId: string): Promise<LoyaltyAccount> => {
    const response = await apiClient.put(`/loyalty/accounts/${customerId}/tier`, { tier_id: tierId });
    return response.data;
  },
};
