/**
 * src/api/marketIntelligence.ts
 * Backend-aligned market intelligence adapters
 */
import { request } from './client';

const MARKET_BASE = '/api/v1/market';

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
  forecast_period: string;
  confidence_score: number;
  factors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
  created_at: string;
}

export interface MarketRecommendation {
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
}

const nowIso = () => new Date().toISOString();

const toSummaryList = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (payload && typeof payload === 'object') {
    return [payload as Record<string, unknown>];
  }
  return [];
};

const toTrend = (signalType?: string, value?: number): PriceSignal['trend'] => {
  if ((signalType ?? '').includes('DOWN') || Number(value ?? 0) < 0) {
    return 'DOWN';
  }
  if ((signalType ?? '').includes('UP') || Number(value ?? 0) > 0) {
    return 'UP';
  }
  return 'STABLE';
};

const mapAlertType = (type?: string): MarketAlert['type'] => {
  switch (type) {
    case 'PRICE_RISE':
      return 'PRICE_RISE';
    case 'NEW_COMPETITOR':
      return 'NEW_COMPETITOR';
    case 'STOCK_OUT':
      return 'STOCK_OUT';
    case 'DEMAND_SPIKE':
      return 'DEMAND_SPIKE';
    default:
      return 'PRICE_DROP';
  }
};

const mapSeverity = (severity?: string): MarketAlert['severity'] => {
  switch (severity) {
    case 'CRITICAL':
      return 'CRITICAL';
    case 'HIGH':
      return 'HIGH';
    case 'MEDIUM':
      return 'MEDIUM';
    default:
      return 'LOW';
  }
};

const makeJsonBlob = (data: unknown) => new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });

export const marketIntelligenceApi = {
  getMarketSummary: async (region?: string): Promise<MarketSummary[]> => {
    const response = await request<unknown>({ url: `${MARKET_BASE}/summary`, method: 'GET' });

    return toSummaryList(response)
      .map((item) => ({
        region: String(item.region ?? item.region_code ?? item.name ?? 'All Regions'),
        total_stores: Number(item.total_stores ?? item.store_count ?? 0),
        average_price: Number(item.average_price ?? item.avg_price ?? 0),
        price_volatility: Number(item.price_volatility ?? 0),
        demand_index: Number(item.demand_index ?? 0),
        competitor_count: Number(item.competitor_count ?? 0),
        last_updated: String(item.last_updated ?? nowIso()),
      }))
      .filter((item) => !region || item.region.toLowerCase().includes(region.toLowerCase()));
  },

  getPriceSignals: async (params?: {
    product_id?: string;
    category?: string;
    region?: string;
    trend?: 'UP' | 'DOWN' | 'STABLE';
    page?: number;
    limit?: number;
  }): Promise<{ signals: PriceSignal[]; total: number; page: number; pages: number }> => {
    const response = await request<Array<{
      id?: string | number;
      signal_type?: string;
      region_code?: string;
      value?: number;
      confidence?: number;
      timestamp?: string;
    }>>({
      url: `${MARKET_BASE}/signals`,
      method: 'GET',
      params: {
        limit: params?.limit,
      },
    });

    const signals = Array.isArray(response)
      ? response.map((signal) => ({
          id: String(signal.id ?? ''),
          product_id: params?.product_id ?? '',
          product_name: `Signal ${signal.id ?? ''}`,
          sku: '',
          current_price: Number(signal.value ?? 0),
          market_price: Number(signal.value ?? 0),
          price_difference: 0,
          price_difference_percent: 0,
          trend: toTrend(signal.signal_type, signal.value),
          confidence: Number(signal.confidence ?? 0),
          signal_date: signal.timestamp ?? nowIso(),
          region: String(signal.region_code ?? ''),
          competitor_prices: [],
        }))
      : [];

    const filtered = signals.filter((signal) => {
      if (params?.region && !signal.region.toLowerCase().includes(params.region.toLowerCase())) {
        return false;
      }
      if (params?.trend && signal.trend !== params.trend) {
        return false;
      }
      return true;
    });

    return {
      signals: filtered,
      total: filtered.length,
      page: params?.page ?? 1,
      pages: filtered.length ? 1 : 0,
    };
  },

  getPriceIndices: async (_params?: {
    category?: string;
    region?: string;
    from_period?: string;
    to_period?: string;
  }): Promise<PriceIndex[]> => {
    const response = await request<Array<{
      id?: string | number;
      category_id?: string | number;
      region_code?: string;
      index_value?: number;
      computed_at?: string;
    }>>({
      url: `${MARKET_BASE}/indices`,
      method: 'GET',
    });

    return Array.isArray(response)
      ? response.map((index) => ({
          id: String(index.id ?? ''),
          category: String(index.category_id ?? ''),
          region: String(index.region_code ?? ''),
          index_value: Number(index.index_value ?? 0),
          base_value: 100,
          change_percent: Number(index.index_value ?? 0) - 100,
          period: '',
          created_at: index.computed_at ?? nowIso(),
        }))
      : [];
  },

  computePriceIndex: async (data: {
    category: string;
    region: string;
    period: string;
    product_ids: string[];
  }): Promise<PriceIndex> => {
    const response = await request<{ category_id?: string | number; new_index?: number }>({
      url: `${MARKET_BASE}/indices/compute`,
      method: 'POST',
      data: { category_id: data.category },
    });

    return {
      id: `index-${Date.now()}`,
      category: String(response.category_id ?? data.category),
      region: data.region,
      index_value: Number(response.new_index ?? 0),
      base_value: 100,
      change_percent: Number(response.new_index ?? 0) - 100,
      period: data.period,
      created_at: nowIso(),
    };
  },

  getAlerts: async (_params?: {
    type?: string;
    severity?: string;
    acknowledged?: boolean;
    region?: string;
    page?: number;
    limit?: number;
  }): Promise<{ alerts: MarketAlert[]; total: number; page: number; pages: number }> => {
    const response = await request<Array<{
      id?: string | number;
      alert_type?: string;
      severity?: string;
      message?: string;
      recommended_action?: string;
      acknowledged?: boolean;
      created_at?: string;
    }>>({
      url: `${MARKET_BASE}/alerts`,
      method: 'GET',
      params: { unacknowledged_only: false },
    });

    const alerts = Array.isArray(response)
      ? response.map((alert) => ({
          id: String(alert.id ?? ''),
          type: mapAlertType(alert.alert_type),
          severity: mapSeverity(alert.severity),
          title: String(alert.alert_type ?? 'Market Alert').replace(/_/g, ' '),
          message: alert.recommended_action ? `${alert.message ?? ''} ${alert.recommended_action}`.trim() : alert.message ?? '',
          is_acknowledged: Boolean(alert.acknowledged),
          created_at: alert.created_at ?? nowIso(),
        }))
      : [];

    return {
      alerts,
      total: alerts.length,
      page: 1,
      pages: alerts.length ? 1 : 0,
    };
  },

  acknowledgeAlert: async (alertId: string): Promise<MarketAlert> => {
    await request<{ id?: string | number; acknowledged?: boolean }>({
      url: `${MARKET_BASE}/alerts/${alertId}/acknowledge`,
      method: 'POST',
    });

    return {
      id: alertId,
      type: 'PRICE_DROP',
      severity: 'LOW',
      title: 'Market Alert',
      message: 'Alert acknowledged',
      is_acknowledged: true,
      created_at: nowIso(),
    };
  },

  getCompetitors: async (region?: string): Promise<CompetitorAnalysis[]> => {
    const response = await request<CompetitorAnalysis[]>({
      url: `${MARKET_BASE}/competitors`,
      method: 'GET',
      params: region ? { region } : undefined,
    });

    return Array.isArray(response) ? response : [];
  },

  getCompetitorDetail: async (competitorId: string): Promise<CompetitorAnalysis> => {
    const response = await request<CompetitorAnalysis>({
      url: `${MARKET_BASE}/competitors/${competitorId}`,
      method: 'GET',
    });

    return response;
  },

  getDemandForecasts: async (params?: {
    product_id?: string;
    category?: string;
    region?: string;
    from_period?: string;
    to_period?: string;
  }): Promise<DemandForecast[]> => {
    const response = await request<DemandForecast[]>({
      url: `${MARKET_BASE}/forecasts`,
      method: 'GET',
      params,
    });

    return Array.isArray(response) ? response : [];
  },

  generateForecast: async (data: {
    product_id: string;
    forecast_period: string;
    factors?: string[];
  }): Promise<DemandForecast> => request<DemandForecast>({
    url: `${MARKET_BASE}/forecasts/generate`,
    method: 'POST',
    data: {
      product_id: data.product_id,
      forecast_period: data.forecast_period,
      factors: data.factors ?? [],
    },
  }),

  getMarketTrends: async (_params?: {
    region?: string;
    category?: string;
    period?: string;
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
  }> => ({
    price_trends: [],
    demand_trends: [],
    competitor_activity: [],
  }),

  getRecommendations: async (params?: {
    product_id?: string;
    category?: string;
    region?: string;
    type?: 'PRICING' | 'STOCK' | 'MARKETING';
  }): Promise<MarketRecommendation[]> => {
    const response = await request<MarketRecommendation[]>({
      url: `${MARKET_BASE}/recommendations`,
      method: 'GET',
      params,
    });

    return Array.isArray(response) ? response : [];
  },

  exportSignals: async (_params?: {
    format?: 'csv' | 'excel' | 'json';
    from_date?: string;
    to_date?: string;
    product_ids?: string[];
  }): Promise<Blob> => {
    const data = await marketIntelligenceApi.getPriceSignals();
    return makeJsonBlob(data.signals);
  },

  exportForecasts: async (_params?: {
    format?: 'csv' | 'excel' | 'json';
    period?: string;
    product_ids?: string[];
  }): Promise<Blob> => {
    const data = await marketIntelligenceApi.getDemandForecasts();
    return makeJsonBlob(data);
  },
};
