/**
 * src/hooks/gst.ts
 * React Query hooks for GST operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gstApi from '@/api/gst';
import type { 
  GSTConfig,
  TaxConfig,
  TaxCalculationRequest,
  TaxCategory,
  HSNMapping,
} from '@/api/gst';

// Query keys
export const gstKeys = {
  all: ['gst'] as const,
  config: () => [...gstKeys.all, 'config'] as const,
  summary: (period: string) => [...gstKeys.all, 'summary', period] as const,
  gstr1: (period: string) => [...gstKeys.all, 'gstr1', period] as const,
  liabilitySlabs: () => [...gstKeys.all, 'liabilitySlabs'] as const,
  taxConfig: () => [...gstKeys.all, 'taxConfig'] as const,
  taxCategories: () => [...gstKeys.all, 'taxCategories'] as const,
  hsnMappings: () => [...gstKeys.all, 'hsnMappings'] as const,
  hsnSearch: (query: string) => [...gstKeys.all, 'hsnSearch', query] as const,
};

// GST Configuration
export const useGSTConfigQuery = () => {
  return useQuery({
    queryKey: gstKeys.config(),
    queryFn: () => gstApi.gstApi.getGSTConfig(),
    staleTime: 60000, // 1 minute
  });
};

export const useUpdateGSTConfigMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<GSTConfig>) => gstApi.gstApi.updateGSTConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.config() });
    },
  });
};

// GST Summary
export const useGSTSummaryQuery = (period: string) => {
  return useQuery({
    queryKey: gstKeys.summary(period),
    queryFn: () => gstApi.gstApi.getGSTSummary(period),
    enabled: Boolean(period),
    staleTime: 300000, // 5 minutes
  });
};

// GSTR-1 Returns
export const useGSTR1Query = (period: string) => {
  return useQuery({
    queryKey: gstKeys.gstr1(period),
    queryFn: () => gstApi.gstApi.getGSTR1(period),
    enabled: Boolean(period),
    staleTime: 300000, // 5 minutes
  });
};

export const useGenerateGSTR1Mutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (period: string) => gstApi.gstApi.generateGSTR1(period),
    onSuccess: (_, period) => {
      queryClient.invalidateQueries({ queryKey: gstKeys.gstr1(period) });
    },
  });
};

export const useFileGSTR1Mutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (period: string) => gstApi.gstApi.fileGSTR1(period),
    onSuccess: (_, period) => {
      queryClient.invalidateQueries({ queryKey: gstKeys.gstr1(period) });
    },
  });
};

// HSN Search
export const useHSNSearchQuery = (query: string) => {
  return useQuery({
    queryKey: gstKeys.hsnSearch(query),
    queryFn: () => gstApi.gstApi.searchHSN(query),
    enabled: Boolean(query && query.length >= 3),
    staleTime: 600000, // 10 minutes
  });
};

// GST Liability Slabs
export const useLiabilitySlabsQuery = () => {
  return useQuery({
    queryKey: gstKeys.liabilitySlabs(),
    queryFn: () => gstApi.gstApi.getLiabilitySlabs(),
    staleTime: 3600000, // 1 hour
  });
};

// Tax Configuration
export const useTaxConfigQuery = () => {
  return useQuery({
    queryKey: gstKeys.taxConfig(),
    queryFn: () => gstApi.gstApi.getTaxConfig(),
    staleTime: 60000, // 1 minute
  });
};

export const useUpdateTaxConfigMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<TaxConfig>) => gstApi.gstApi.updateTaxConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.taxConfig() });
    },
  });
};

// Tax Calculation
export const useCalculateTaxMutation = () => {
  return useMutation({
    mutationFn: (data: TaxCalculationRequest) => gstApi.gstApi.calculateTax(data),
  });
};

// Tax Categories
export const useTaxCategoriesQuery = () => {
  return useQuery({
    queryKey: gstKeys.taxCategories(),
    queryFn: () => gstApi.gstApi.getTaxCategories(),
    staleTime: 60000, // 1 minute
  });
};

export const useCreateTaxCategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<TaxCategory, 'id'>) => gstApi.gstApi.createTaxCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.taxCategories() });
      queryClient.invalidateQueries({ queryKey: gstKeys.taxConfig() });
    },
  });
};

export const useUpdateTaxCategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaxCategory> }) =>
      gstApi.gstApi.updateTaxCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.taxCategories() });
      queryClient.invalidateQueries({ queryKey: gstKeys.taxConfig() });
    },
  });
};

export const useDeleteTaxCategoryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => gstApi.gstApi.deleteTaxCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.taxCategories() });
      queryClient.invalidateQueries({ queryKey: gstKeys.taxConfig() });
    },
  });
};

// HSN Mappings
export const useHSNMappingsQuery = () => {
  return useQuery({
    queryKey: gstKeys.hsnMappings(),
    queryFn: () => gstApi.gstApi.getHSNMappings(),
    staleTime: 60000, // 1 minute
  });
};

export const useCreateHSNMappingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<HSNMapping, 'hsn_code'> & { hsn_code: string }) =>
      gstApi.gstApi.createHSNMapping(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.hsnMappings() });
      queryClient.invalidateQueries({ queryKey: gstKeys.taxConfig() });
    },
  });
};

export const useUpdateHSNMappingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ hsn_code, data }: { hsn_code: string; data: Partial<HSNMapping> }) =>
      gstApi.gstApi.updateHSNMapping(hsn_code, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.hsnMappings() });
      queryClient.invalidateQueries({ queryKey: gstKeys.taxConfig() });
    },
  });
};

export const useDeleteHSNMappingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (hsn_code: string) => gstApi.gstApi.deleteHSNMapping(hsn_code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gstKeys.hsnMappings() });
      queryClient.invalidateQueries({ queryKey: gstKeys.taxConfig() });
    },
  });
};
