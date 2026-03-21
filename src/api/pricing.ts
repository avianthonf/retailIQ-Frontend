import { request } from '@/api/client';
import type {
  ApplyPricingSuggestionResponse,
  DismissPricingSuggestionResponse,
  GetPriceHistoryResponse,
  GetPricingRulesResponse,
  ListPricingSuggestionsResponse,
  UpdatePricingRulesRequest,
  UpdatePricingRulesResponse,
} from '@/types/api';

const BASE = '/api/v1/pricing';

export const listSuggestions = () =>
  request<ListPricingSuggestionsResponse>({ url: `${BASE}/suggestions`, method: 'GET' });

export const applySuggestion = (suggestionId: number | string) =>
  request<ApplyPricingSuggestionResponse>({ url: `${BASE}/suggestions/${suggestionId}/apply`, method: 'POST' });

export const dismissSuggestion = (suggestionId: number | string) =>
  request<DismissPricingSuggestionResponse>({ url: `${BASE}/suggestions/${suggestionId}/dismiss`, method: 'POST' });

export const getPriceHistory = (productId: number | string) =>
  request<GetPriceHistoryResponse>({ url: `${BASE}/history`, method: 'GET', params: { product_id: productId } });

export const getPricingRules = () =>
  request<GetPricingRulesResponse>({ url: `${BASE}/rules`, method: 'GET' });

export const updatePricingRules = (data: UpdatePricingRulesRequest) =>
  request<UpdatePricingRulesResponse>({ url: `${BASE}/rules`, method: 'PUT', data });
