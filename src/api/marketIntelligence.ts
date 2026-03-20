/**
 * src/api/marketIntelligence.ts
 * Market Intelligence API
 */
import { apiClient } from './client';

// Market Intelligence types
export interface MarketSummary {
  region: string;
  total_stores: number;
  average_price: number;
  price_volatility: number;
  demand_index: number;
  competitor_count: number;
  last_updated: string;
}

export interface PriceSignal {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  current_price: number;
  market_price: number;
  price_difference: number;
  price_difference_percent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  confidence: number;
  signal_date: string;
  region: string;
  competitor_prices: {
    competitor_name: string;
    price: number;
    last_seen: string;
  }[];
}

export interface PriceIndex {
  id: string;
  category: string;
  region: string;
  index_value: number;
  base_value: number;
  change_percent: number;
  period: string;
  created_at: string;
}

export interface MarketAlert {
  id: string;
  type: 'PRICE_DROP' | 'PRICE_RISE' | 'NEW_COMPETITOR' | 'STOCK_OUT' | 'DEMAND_SPIKE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  product_id?: string;
  product_name?: string;
  region?: string;
  threshold_value?: number;
  current_value?: number;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface CompetitorAnalysis {
  competitor_id: string;
  name: string;
  region: string;
  total_products: number;
  average_pricing: number;
  pricing_strategy: 'PREMIUM' | 'VALUE' | 'COMPETITIVE';
  market_share: number;
  strengths: string[];
  weaknesses: string[];
  last_analyzed: string;
  price_comparison: {
    category: string;
    competitor_price: number;
    our_price: number;
    difference: number;
  }[];
}

export interface DemandForecast {
  product_id: string;
  product_name: string;
  sku: string;
  current_demand: number;
  forecast_demand: number;
  forecast_period: string; // e.g., "2024-04" for April 2024
  confidence_score: number;
  factors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
  created_at: string;
}

// Market Intelligence API
export const marketIntelligenceApi = {
  // Market Summary
  getMarketSummary: async (region?: string): Promise<MarketSummary[]> => {
    const response = await apiClient.get('/market/summary', {
      params: region ? { region } : undefined
    });
    return response.data;
  },

  // Price Signals
  getPriceSignals: async (params?: {
    product_id?: string;
    category?: string;
    region?: string;
    trend?: 'UP' | 'DOWN' | 'STABLE';
    page?: number;
    limit?: number;
  }): Promise<{ signals: PriceSignal[]; total: number; page: number; pages: number }> => {
    const response = await apiClient.get('/market/signals', { params });
    return response.data;
  },

  // Price Indices
  getPriceIndices: async (params?: {
    category?: string;
    region?: string;
    from_period?: string;
    to_period?: string;
  }): Promise<PriceIndex[]> => {
    const response = await apiClient.get('/market/indices', { params });
    return response.data;
  },

  // Compute Price Index
  computePriceIndex: async (data: {
    category: string;
    region: string;
    period: string;
    product_ids: string[];
  }): Promise<PriceIndex> => {
    const response = await apiClient.post('/market/indices/compute', data);
    return response.data;
  },

  // Alerts
  getAlerts: async (params?: {
    type?: string;
    severity?: string;
    acknowledged?: boolean;
    region?: string;
    page?: number;
    limit?: number;
  }): Promise<{ alerts: MarketAlert[]; total: number; page: number; pages: number }> => {
    const response = await apiClient.get('/market/alerts', { params });
    return response.data;
  },

  acknowledgeAlert: async (alertId: string): Promise<MarketAlert> => {
    const response = await apiClient.post(`/market/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  // Competitor Analysis
  getCompetitors: async (region?: string): Promise<CompetitorAnalysis[]> => {
    const response = await apiClient.get('/market/competitors', {
      params: region ? { region } : undefined
    });
    return response.data;
  },

  getCompetitorDetail: async (competitorId: string): Promise<CompetitorAnalysis> => {
    const response = await apiClient.get(`/market/competitors/${competitorId}`);
    return response.data;
  },

  // Demand Forecasting
  getDemandForecasts: async (params?: {
    product_id?: string;
    category?: string;
    region?: string;
    from_period?: string;
    to_period?: string;
  }): Promise<DemandForecast[]> => {
    const response = await apiClient.get('/market/forecasts', { params });
    return response.data;
  },

  generateForecast: async (data: {
    product_id: string;
    forecast_period: string;
    factors?: string[];
  }): Promise<DemandForecast> => {
    const response = await apiClient.post('/market/forecasts', data);
    return response.data;
  },

  // Market Trends
  getMarketTrends: async (params?: {
    region?: string;
    category?: string;
    period?: string; // e.g., "7d", "30d", "90d"
  }): Promise<{
    price_trends: {
      date: string;
      average_price: number;
      index_value: number;
    }[];
    demand_trends: {
      date: string;
      demand_index: number;
    }[];
    competitor_activity: {
      date: string;
      new_competitors: number;
      price_changes: number;
    }[];
  }> => {
    const response = await apiClient.get('/market/trends', { params });
    return response.data;
  },

  // Recommendations
  getRecommendations: async (params?: {
    product_id?: string;
    category?: string;
    region?: string;
    type?: 'PRICING' | 'STOCK' | 'MARKETING';
  }): Promise<{
    id: string;
    type: 'PRICING' | 'STOCK' | 'MARKETING';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    title: string;
    description: string;
    expected_impact: string;
    effort_required: 'LOW' | 'MEDIUM' | 'HIGH';
    due_date?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    created_at: string;
  }[]> => {
    const response = await apiClient.get('/market/recommendations', { params });
    return response.data;
  },

  // Export Data
  exportSignals: async (params?: {
    format?: 'csv' | 'excel' | 'json';
    from_date?: string;
    to_date?: string;
    product_ids?: string[];
  }): Promise<Blob> => {
    const response = await apiClient.get('/market/export/signals', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  exportForecasts: async (params?: {
    format?: 'csv' | 'excel' | 'json';
    period?: string;
    product_ids?: string[];
  }): Promise<Blob> => {
    const response = await apiClient.get('/market/export/forecasts', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
};
