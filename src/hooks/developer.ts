/**
 * src/hooks/developer.ts
 * React Query hooks for Developer API operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as developerApi from '@/api/developer';
import type { 
  CreateApiKeyRequest,
  CreateWebhookRequest,
  CreateOAuthApplicationRequest
} from '@/api/developer';

// Query keys
export const developerKeys = {
  all: ['developer'] as const,
  apiKeys: () => [...developerKeys.all, 'apiKeys'] as const,
  webhooks: () => [...developerKeys.all, 'webhooks'] as const,
  usage: (params?: Record<string, unknown>) => [...developerKeys.all, 'usage', ...(params ? [params] : [])] as const,
  oauthApplications: () => [...developerKeys.all, 'oauthApplications'] as const,
  documentation: () => [...developerKeys.all, 'documentation'] as const,
  rateLimits: () => [...developerKeys.all, 'rateLimits'] as const,
  logs: (params?: Record<string, unknown>) => [...developerKeys.all, 'logs', ...(params ? [params] : [])] as const,
};

// API Keys
export const useApiKeysQuery = () => {
  return useQuery({
    queryKey: developerKeys.apiKeys(),
    queryFn: () => developerApi.developerApi.getApiKeys(),
    staleTime: 60000, // 1 minute
  });
};

export const useCreateApiKeyMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) => developerApi.developerApi.createApiKey(data),
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

// Webhooks
export const useWebhooksQuery = () => {
  return useQuery({
    queryKey: developerKeys.webhooks(),
    queryFn: () => developerApi.developerApi.getWebhooks(),
    staleTime: 60000, // 1 minute
  });
};

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

export const useTestWebhookMutation = () => {
  return useMutation({
    mutationFn: (webhookId: string) => developerApi.developerApi.testWebhook(webhookId),
  });
};

// Usage Analytics
export const useUsageStatsQuery = (params?: {
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: developerKeys.usage(params),
    queryFn: () => developerApi.developerApi.getUsageStats(params),
    staleTime: 300000, // 5 minutes
  });
};

// OAuth Applications
export const useOAuthApplicationsQuery = () => {
  return useQuery({
    queryKey: developerKeys.oauthApplications(),
    queryFn: () => developerApi.developerApi.getOAuthApplications(),
    staleTime: 60000, // 1 minute
  });
};

export const useCreateOAuthApplicationMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOAuthApplicationRequest) => 
      developerApi.developerApi.createOAuthApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.oauthApplications() });
    },
  });
};

export const useUpdateOAuthApplicationMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: Partial<CreateOAuthApplicationRequest> }) =>
      developerApi.developerApi.updateOAuthApplication(clientId, data),
    onSuccess: (_, { clientId: _clientId }) => {
      queryClient.invalidateQueries({ queryKey: developerKeys.oauthApplications() });
    },
  });
};

export const useDeleteOAuthApplicationMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clientId: string) => developerApi.developerApi.deleteOAuthApplication(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.oauthApplications() });
    },
  });
};

export const useRegenerateClientSecretMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clientId: string) => developerApi.developerApi.regenerateClientSecret(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: developerKeys.oauthApplications() });
    },
  });
};

// Documentation
export const useApiDocumentationQuery = () => {
  return useQuery({
    queryKey: developerKeys.documentation(),
    queryFn: () => developerApi.developerApi.getApiDocumentation(),
    staleTime: 600000, // 10 minutes
  });
};

// Rate Limits
export const useRateLimitsQuery = () => {
  return useQuery({
    queryKey: developerKeys.rateLimits(),
    queryFn: () => developerApi.developerApi.getRateLimits(),
    staleTime: 60000, // 1 minute
  });
};

// Logs
export const useApiLogsQuery = (params?: {
  from_date?: string;
  to_date?: string;
  level?: 'error' | 'warn' | 'info';
  limit?: number;
}) => {
  return useQuery({
    queryKey: developerKeys.logs(params),
    queryFn: () => developerApi.developerApi.getApiLogs(params),
    staleTime: 60000, // 1 minute
  });
};
