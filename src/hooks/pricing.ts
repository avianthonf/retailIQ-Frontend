import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pricingApi from '@/api/pricing';
import type { UpdatePricingRulesRequest } from '@/types/api';

export const usePricingSuggestionsQuery = () =>
  useQuery({ queryKey: ['pricing', 'suggestions'], queryFn: () => pricingApi.listSuggestions(), staleTime: 60_000 });

export const useApplySuggestionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => pricingApi.applySuggestion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing', 'suggestions'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useDismissSuggestionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => pricingApi.dismissSuggestion(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing', 'suggestions'] }); },
  });
};

export const usePriceHistoryQuery = (productId: number | string) =>
  useQuery({ queryKey: ['pricing', 'history', productId], queryFn: () => pricingApi.getPriceHistory(productId), staleTime: 120_000, enabled: Boolean(productId) });

export const usePricingRulesQuery = () =>
  useQuery({ queryKey: ['pricing', 'rules'], queryFn: () => pricingApi.getPricingRules(), staleTime: 120_000 });

export const useUpdatePricingRulesMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePricingRulesRequest) => pricingApi.updatePricingRules(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing', 'rules'] }); },
  });
};
