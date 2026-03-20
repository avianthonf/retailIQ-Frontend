/**
 * src/api/analytics.ts
 * Oracle Document sections consumed: 3.2, 5.2, 5.12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { apiClient } from './client';

// Analytics request/response types based on Oracle Section 3.2
export interface RevenueMetricsResponse {
  total_revenue: number;
  total_profit: number;
  total_orders: number;
  average_order_value: number;
  growth_rate?: number;
}

export interface TopProductsResponse {
  product_id: string;
  name: string;
  sku_code: string;
  total_sold: number;
  revenue: number;
}

export interface CategoryBreakdownResponse {
  category_id: string;
  name: string;
  revenue: number;
  profit: number;
  percentage: number;
}

export interface PaymentModeSummaryResponse {
  payment_mode: string;
  count: number;
  amount: number;
  percentage: number;
}

// ⚠️ ORACLE UNCERTAIN: Analytics endpoints may return mixed response shapes
// Some analytics endpoints use standard envelope, others return raw JSON
const normalizeAnalyticsResponse = (response: unknown) => {
  // Handle standard envelope
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: unknown }).data;
  }
  // Handle raw JSON response
  return response;
};

export const analyticsApi = {
  // Get revenue, profit, and order metrics
  // Oracle: GET /api/v1/analytics/revenue
  getRevenueMetrics: async (): Promise<RevenueMetricsResponse> => {
    const response = await apiClient.get('/analytics/revenue');
    return normalizeAnalyticsResponse(response.data) as RevenueMetricsResponse;
  },

  // Get top selling products
  // Oracle: GET /api/v1/analytics/top-products
  getTopProducts: async (): Promise<TopProductsResponse[]> => {
    const response = await apiClient.get('/analytics/top-products');
    const data = normalizeAnalyticsResponse(response.data);
    // Ensure array response
    return Array.isArray(data) ? data : (data as any)?.products || [];
  },

  // Get revenue breakdown by category
  // Oracle: GET /api/v1/analytics/categories
  getCategoryBreakdown: async (): Promise<CategoryBreakdownResponse[]> => {
    const response = await apiClient.get('/analytics/categories');
    const data = normalizeAnalyticsResponse(response.data);
    // Ensure array response
    return Array.isArray(data) ? data : (data as any)?.categories || [];
  },

  // Get payment mode distribution
  // Oracle: GET /api/v1/analytics/payment-modes
  getPaymentModeSummary: async (): Promise<PaymentModeSummaryResponse[]> => {
    const response = await apiClient.get('/analytics/payment-modes');
    const data = normalizeAnalyticsResponse(response.data);
    // Ensure array response
    return Array.isArray(data) ? data : (data as any)?.payment_modes || [];
  },

  // Get customer analytics
  // Oracle: GET /api/v1/analytics/customers
  getCustomerAnalytics: async () => {
    const response = await apiClient.get('/analytics/customers');
    return normalizeAnalyticsResponse(response.data);
  },

  // Get profit contribution analysis
  // Oracle: GET /api/v1/analytics/contribution
  getProfitContribution: async () => {
    const response = await apiClient.get('/analytics/contribution');
    return normalizeAnalyticsResponse(response.data);
  },

  // Get diagnostic metrics
  // Oracle: GET /api/v1/analytics/diagnostics
  getDiagnostics: async () => {
    const response = await apiClient.get('/analytics/diagnostics');
    return normalizeAnalyticsResponse(response.data);
  },
};
