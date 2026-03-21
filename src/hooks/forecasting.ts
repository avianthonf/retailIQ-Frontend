import { useQuery } from '@tanstack/react-query';
import * as forecastingApi from '@/api/forecasting';

export const useStoreForecastQuery = (horizon = 7) =>
  useQuery({ queryKey: ['forecasting', 'store', horizon], queryFn: () => forecastingApi.getStoreForecast(horizon), staleTime: 300_000 });

export const useSkuForecastQuery = (productId: number | string, horizon = 7) =>
  useQuery({ queryKey: ['forecasting', 'sku', productId, horizon], queryFn: () => forecastingApi.getSkuForecast(productId, horizon), staleTime: 300_000, enabled: Boolean(productId) });

export const useDemandSensingQuery = (productId: number | string) =>
  useQuery({ queryKey: ['forecasting', 'demand-sensing', productId], queryFn: () => forecastingApi.getDemandSensing(productId), staleTime: 300_000, enabled: Boolean(productId) });
