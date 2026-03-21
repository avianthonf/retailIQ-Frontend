import { useQuery } from '@tanstack/react-query';
import * as i18nApi from '@/api/i18n';
import type { ListTranslationsRequest } from '@/types/api';

export const useTranslationsQuery = (params: ListTranslationsRequest = {}) =>
  useQuery({ queryKey: ['i18n', 'translations', params], queryFn: () => i18nApi.getTranslations(params), staleTime: 300_000 });

export const useSupportedCurrenciesQuery = () =>
  useQuery({ queryKey: ['i18n', 'currencies'], queryFn: () => i18nApi.getSupportedCurrencies(), staleTime: 300_000 });

export const useSupportedCountriesQuery = () =>
  useQuery({ queryKey: ['i18n', 'countries'], queryFn: () => i18nApi.getSupportedCountries(), staleTime: 300_000 });
