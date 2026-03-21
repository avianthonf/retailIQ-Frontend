/**
 * src/hooks/marketIntelligence.ts
 * React Query hooks for Market Intelligence operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as marketIntelligenceApi from '@/api/marketIntelligence';


// Query keys
export const marketIntelligenceKeys = {
  all: ['marketIntelligence'] as const,
  summary: (region?: string) => [...marketIntelligenceKeys.all, 'summary', ...(region ? [region] : [])] as const,
  signals: (params?: Record<string, unknown>) => [...marketIntelligenceKeys.all, 'signals', ...(params ? [params] : [])] as const,
  indices: (params?: Record<string, unknown>) => [...marketIntelligenceKeys.all, 'indices', ...(params ? [params] : [])] as const,
  alerts: (params?: Record<string, unknown>) => [...marketIntelligenceKeys.all, 'alerts', ...(params ? [params] : [])] as const,
  competitors: (region?: string) => [...marketIntelligenceKeys.all, 'competitors', ...(region ? [region] : [])] as const,
  competitor: (id: string) => [...marketIntelligenceKeys.all, 'competitor', id] as const,
  forecasts: (params?: Record<string, unknown>) => [...marketIntelligenceKeys.all, 'forecasts', ...(params ? [params] : [])] as const,
  trends: (params?: Record<string, unknown>) => [...marketIntelligenceKeys.all, 'trends', ...(params ? [params] : [])] as const,
  recommendations: (params?: Record<string, unknown>) => [...marketIntelligenceKeys.all, 'recommendations', ...(params ? [params] : [])] as const,
};

// Market Summary
export const useMarketSummaryQuery = (region?: string) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.summary(region),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getMarketSummary(region),
    staleTime: 300000, // 5 minutes
  });
};

// Price Signals
export const usePriceSignalsQuery = (params?: {
  product_id?: string;
  category?: string;
  region?: string;
  trend?: 'UP' | 'DOWN' | 'STABLE';
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.signals(params),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getPriceSignals(params),
    staleTime: 60000, // 1 minute
  });
};

// Price Indices
export const usePriceIndicesQuery = (params?: {
  category?: string;
  region?: string;
  from_period?: string;
  to_period?: string;
}) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.indices(params),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getPriceIndices(params),
    staleTime: 300000, // 5 minutes
  });
};

export const useComputePriceIndexMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      category: string;
      region: string;
      period: string;
      product_ids: string[];
    }) => marketIntelligenceApi.marketIntelligenceApi.computePriceIndex(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketIntelligenceKeys.indices() });
    },
  });
};

// Alerts
export const useMarketAlertsQuery = (params?: {
  type?: string;
  severity?: string;
  acknowledged?: boolean;
  region?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.alerts(params),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getAlerts(params),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useAcknowledgeAlertMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertId: string) => marketIntelligenceApi.marketIntelligenceApi.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketIntelligenceKeys.alerts() });
    },
  });
};

// Competitor Analysis
export const useCompetitorsQuery = (region?: string) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.competitors(region),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getCompetitors(region),
    staleTime: 600000, // 10 minutes
  });
};

export const useCompetitorDetailQuery = (competitorId: string) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.competitor(competitorId),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getCompetitorDetail(competitorId),
    enabled: Boolean(competitorId),
    staleTime: 300000, // 5 minutes
  });
};

// Demand Forecasting
export const useDemandForecastsQuery = (params?: {
  product_id?: string;
  category?: string;
  region?: string;
  from_period?: string;
  to_period?: string;
}) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.forecasts(params),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getDemandForecasts(params),
    staleTime: 300000, // 5 minutes
  });
};

export const useGenerateForecastMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: {
      product_id: string;
      forecast_period: string;
      factors?: string[];
    }) => marketIntelligenceApi.marketIntelligenceApi.generateForecast(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketIntelligenceKeys.forecasts() });
    },
  });
};

// Market Trends
export const useMarketTrendsQuery = (params?: {
  region?: string;
  category?: string;
  period?: string;
}) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.trends(params),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getMarketTrends(params),
    staleTime: 300000, // 5 minutes
  });
};

// Recommendations
export const useRecommendationsQuery = (params?: {
  product_id?: string;
  category?: string;
  region?: string;
  type?: 'PRICING' | 'STOCK' | 'MARKETING';
}) => {
  return useQuery({
    queryKey: marketIntelligenceKeys.recommendations(params),
    queryFn: () => marketIntelligenceApi.marketIntelligenceApi.getRecommendations(params),
    staleTime: 600000, // 10 minutes
  });
};

// Export Data
export const useExportSignalsMutation = () => {
  return useMutation({
    mutationFn: (params?: {
      format?: 'csv' | 'excel' | 'json';
      from_date?: string;
      to_date?: string;
      product_ids?: string[];
    }) => marketIntelligenceApi.marketIntelligenceApi.exportSignals(params),
  });
};

export const useExportForecastsMutation = () => {
  return useMutation({
    mutationFn: (params?: {
      format?: 'csv' | 'excel' | 'json';
      period?: string;
      product_ids?: string[];
    }) => marketIntelligenceApi.marketIntelligenceApi.exportForecasts(params),
  });
};
