import { request, requestEnvelope } from '@/api/client';
import type {
  GetDemandSensingResponse,
  GetStoreForecastResponse,
  GetSkuForecastResponse,
} from '@/types/api';

const BASE = '/api/v1/forecasting';

export const getStoreForecast = (horizon = 7) =>
  requestEnvelope<GetStoreForecastResponse>({ url: `${BASE}/store`, method: 'GET', params: { horizon } });

export const getSkuForecast = (productId: number | string, horizon = 7) =>
  requestEnvelope<GetSkuForecastResponse>({ url: `${BASE}/sku/${productId}`, method: 'GET', params: { horizon } });

export const getDemandSensing = (productId: number | string) =>
  request<GetDemandSensingResponse>({ url: `${BASE}/demand-sensing/${productId}`, method: 'GET' });
