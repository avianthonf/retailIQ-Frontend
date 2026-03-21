import { request } from '@/api/client';
import type {
  GetSupportedCountriesResponse,
  GetSupportedCurrenciesResponse,
  GetTranslationsResponse,
  ListTranslationsRequest,
} from '@/types/api';

const BASE = '/api/v1/i18n';

export const getTranslations = (params: ListTranslationsRequest = {}) =>
  request<GetTranslationsResponse>({ url: `${BASE}/i18n/translations`, method: 'GET', params });

export const getSupportedCurrencies = () =>
  request<GetSupportedCurrenciesResponse>({ url: `${BASE}/i18n/currencies`, method: 'GET' });

export const getSupportedCountries = () =>
  request<GetSupportedCountriesResponse>({ url: `${BASE}/i18n/countries`, method: 'GET' });
