/**
 * src/api/analytics.ts
 * Backend-aligned analytics adapters
 */
import { requestEnvelope } from './client';

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

interface RevenueRow {
  revenue?: number;
  profit?: number;
  transactions?: number;
}

export const analyticsApi = {
  getRevenueMetrics: async (): Promise<RevenueMetricsResponse> => {
    const { data } = await requestEnvelope<RevenueRow[]>({ url: '/api/v1/analytics/revenue', method: 'GET' });
    const rows = Array.isArray(data) ? data : [];
    const totalRevenue = rows.reduce((sum, row) => sum + Number(row.revenue ?? 0), 0);
    const totalProfit = rows.reduce((sum, row) => sum + Number(row.profit ?? 0), 0);
    const totalOrders = rows.reduce((sum, row) => sum + Number(row.transactions ?? 0), 0);
    const previousRevenue = rows.length > 1 ? Number(rows[rows.length - 2]?.revenue ?? 0) : 0;
    const currentRevenue = rows.length > 0 ? Number(rows[rows.length - 1]?.revenue ?? 0) : 0;

    return {
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_orders: totalOrders,
      average_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      growth_rate: previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0,
    };
  },

  getTopProducts: async (): Promise<TopProductsResponse[]> => {
    const { data } = await requestEnvelope<Array<Record<string, unknown>>>({ url: '/api/v1/analytics/top-products', method: 'GET' });
    return (Array.isArray(data) ? data : []).map((item) => ({
      product_id: String(item.product_id ?? ''),
      name: String(item.name ?? 'Unknown Product'),
      sku_code: String(item.sku_code ?? ''),
      total_sold: Number(item.quantity ?? 0),
      revenue: Number(item.revenue ?? 0),
    }));
  },

  getCategoryBreakdown: async (): Promise<CategoryBreakdownResponse[]> => {
    const { data } = await requestEnvelope<Array<Record<string, unknown>>>({ url: '/api/v1/analytics/category-breakdown', method: 'GET' });
    return (Array.isArray(data) ? data : []).map((item) => ({
      category_id: String(item.category_id ?? ''),
      name: String(item.name ?? 'Uncategorised'),
      revenue: Number(item.revenue ?? 0),
      profit: Number(item.profit ?? 0),
      percentage: Number(item.share_pct ?? 0),
    }));
  },

  getPaymentModeSummary: async (): Promise<PaymentModeSummaryResponse[]> => {
    const { data } = await requestEnvelope<Array<Record<string, unknown>>>({ url: '/api/v1/analytics/payment-modes', method: 'GET' });
    return (Array.isArray(data) ? data : []).map((item) => ({
      payment_mode: String(item.mode ?? 'UNKNOWN'),
      count: Number(item.txn_count ?? 0),
      amount: Number(item.revenue ?? 0),
      percentage: Number(item.rev_share_pct ?? item.txn_share_pct ?? 0),
    }));
  },

  getCustomerAnalytics: async () => {
    const { data } = await requestEnvelope<Record<string, unknown>>({ url: '/api/v1/analytics/customers/summary', method: 'GET' });
    return data;
  },

  getProfitContribution: async () => {
    const { data } = await requestEnvelope<Record<string, unknown>>({ url: '/api/v1/analytics/contribution', method: 'GET' });
    return data;
  },

  getDiagnostics: async () => {
    const { data } = await requestEnvelope<Record<string, unknown>>({ url: '/api/v1/analytics/diagnostics', method: 'GET' });
    return data;
  },
};
