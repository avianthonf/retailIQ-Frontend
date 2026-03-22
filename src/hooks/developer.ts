/**
 * src/hooks/developer.ts
 * React Query hooks for Developer API operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as developerApi from '@/api/developer';
import type { CreateApiKeyRequest, CreateWebhookRequest } from '@/api/developer';

export const developerKeys = {
  all: ['developer'] as const,
  apiKeys: () => [...developerKeys.all, 'apiKeys'] as const,
  webhooks: () => [...developerKeys.all, 'webhooks'] as const,
  usage: (params?: Record<string, unknown>) => [...developerKeys.all, 'usage', ...(params ? [params] : [])] as const,
  documentation: () => [...developerKeys.all, 'documentation'] as const,
  rateLimits: () => [...developerKeys.all, 'rateLimits'] as const,
  logs: (params?: Record<string, unknown>) => [...developerKeys.all, 'logs', ...(params ? [params] : [])] as const,
};

export const useApiKeysQuery = () =>
  useQuery({
    queryKey: developerKeys.apiKeys(),
    queryFn: () => developerApi.developerApi.getApiKeys(),
    staleTime: 60000,
  });

export const useCreateApiKeyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) => developerApi.developerApi.createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.apiKeys() });
    },
  });
};

export const useUpdateApiKeyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ keyId, data }: { keyId: string; data: Partial<CreateApiKeyRequest> & { description?: string; status?: string } }) =>
      developerApi.developerApi.updateApiKey(keyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.apiKeys() });
    },
  });
};

export const useDeleteApiKeyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => developerApi.developerApi.deleteApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.apiKeys() });
    },
  });
};

export const useRegenerateApiKeyMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keyId: string) => developerApi.developerApi.regenerateApiKey(keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.apiKeys() });
    },
  });
};

export const useWebhooksQuery = () =>
  useQuery({
    queryKey: developerKeys.webhooks(),
    queryFn: () => developerApi.developerApi.getWebhooks(),
    staleTime: 60000,
  });

export const useCreateWebhookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWebhookRequest) => developerApi.developerApi.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.webhooks() });
    },
  });
};

export const useUpdateWebhookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ webhookId, data }: { webhookId: string; data: Partial<CreateWebhookRequest> }) =>
      developerApi.developerApi.updateWebhook(webhookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.webhooks() });
    },
  });
};

export const useDeleteWebhookMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => developerApi.developerApi.deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.webhooks() });
    },
  });
};

export const useTestWebhookMutation = () => useMutation({
  mutationFn: (webhookId: string) => developerApi.developerApi.testWebhook(webhookId),
});

export const useUsageStatsQuery = (params?: { from_date?: string; to_date?: string }) =>
  useQuery({
    queryKey: developerKeys.usage(params),
    queryFn: () => developerApi.developerApi.getUsageStats(params),
    staleTime: 300000,
  });

export const useApiDocumentationQuery = () =>
  useQuery({
    queryKey: developerKeys.documentation(),
    queryFn: () => developerApi.developerApi.getApiDocumentation(),
    staleTime: 600000,
  });

export const useRateLimitsQuery = () =>
  useQuery({
    queryKey: developerKeys.rateLimits(),
    queryFn: () => developerApi.developerApi.getRateLimits(),
    staleTime: 60000,
  });

export const useApiLogsQuery = (params?: { from_date?: string; to_date?: string; level?: 'error' | 'warn' | 'info'; limit?: number }) =>
  useQuery({
    queryKey: developerKeys.logs(params),
    queryFn: () => developerApi.developerApi.getApiLogs(params),
    staleTime: 60000,
  });
