/**
 * src/api/developer.ts
 * Developer API
 */
import { apiClient } from './client';

// Developer API types
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  key_preview: string; // First 8 characters + "..."
  scopes: string[];
  is_active: boolean;
  expires_at?: string;
  last_used_at?: string;
  created_at: string;
  created_by: string;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: string[];
  expires_at?: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
  created_by: string;
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
  secret?: string;
}

export interface ApiUsage {
  date: string;
  requests: number;
  errors: number;
  avg_response_time: number;
}

export interface ApiUsageStats {
  total_requests: number;
  total_errors: number;
  avg_response_time: number;
  top_endpoints: {
    path: string;
    requests: number;
  }[];
  daily_usage: ApiUsage[];
}

export interface OAuthApplication {
  client_id: string;
  client_secret: string;
  name: string;
  description?: string;
  redirect_uris: string[];
  scopes: string[];
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface CreateOAuthApplicationRequest {
  name: string;
  description?: string;
  redirect_uris: string[];
  scopes: string[];
}

export interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export interface ApiDocumentation {
  version: string;
  base_url: string;
  authentication: {
    type: 'api_key' | 'oauth';
    description: string;
  };
  endpoints: {
    path: string;
    method: string;
    description: string;
    parameters?: {
      name: string;
      type: string;
      required: boolean;
      description: string;
    }[];
    response: {
      status: number;
      schema: any;
    };
  }[];
}

// Developer API
export const developerApi = {
  // API Keys
  getApiKeys: async (): Promise<ApiKey[]> => {
    const response = await apiClient.get('/developer/api-keys');
    return response.data;
  },

  createApiKey: async (data: CreateApiKeyRequest): Promise<ApiKey> => {
    const response = await apiClient.post('/developer/api-keys', data);
    return response.data;
  },

  deleteApiKey: async (keyId: string): Promise<void> => {
    await apiClient.delete(`/developer/api-keys/${keyId}`);
  },

  regenerateApiKey: async (keyId: string): Promise<{ key: string }> => {
    const response = await apiClient.post(`/developer/api-keys/${keyId}/regenerate`);
    return response.data;
  },

  // Webhooks
  getWebhooks: async (): Promise<Webhook[]> => {
    const response = await apiClient.get('/developer/webhooks');
    return response.data;
  },

  createWebhook: async (data: CreateWebhookRequest): Promise<Webhook> => {
    const response = await apiClient.post('/developer/webhooks', data);
    return response.data;
  },

  updateWebhook: async (webhookId: string, data: Partial<CreateWebhookRequest>): Promise<Webhook> => {
    const response = await apiClient.put(`/developer/webhooks/${webhookId}`, data);
    return response.data;
  },

  deleteWebhook: async (webhookId: string): Promise<void> => {
    await apiClient.delete(`/developer/webhooks/${webhookId}`);
  },

  testWebhook: async (webhookId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/developer/webhooks/${webhookId}/test`);
    return response.data;
  },

  // Usage Analytics
  getUsageStats: async (params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<ApiUsageStats> => {
    const response = await apiClient.get('/developer/usage', { params });
    return response.data;
  },

  // OAuth Applications
  getOAuthApplications: async (): Promise<OAuthApplication[]> => {
    const response = await apiClient.get('/developer/oauth/applications');
    return response.data;
  },

  createOAuthApplication: async (data: CreateOAuthApplicationRequest): Promise<OAuthApplication> => {
    const response = await apiClient.post('/developer/oauth/applications', data);
    return response.data;
  },

  updateOAuthApplication: async (
    clientId: string, 
    data: Partial<CreateOAuthApplicationRequest>
  ): Promise<OAuthApplication> => {
    const response = await apiClient.put(`/developer/oauth/applications/${clientId}`, data);
    return response.data;
  },

  deleteOAuthApplication: async (clientId: string): Promise<void> => {
    await apiClient.delete(`/developer/oauth/applications/${clientId}`);
  },

  regenerateClientSecret: async (clientId: string): Promise<{ client_secret: string }> => {
    const response = await apiClient.post(`/developer/oauth/applications/${clientId}/regenerate-secret`);
    return response.data;
  },

  // OAuth Flow
  authorize: async (params: {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
    state?: string;
  }): Promise<{ authorize_url: string }> => {
    const response = await apiClient.get('/developer/oauth/authorize', { params });
    return response.data;
  },

  exchangeCodeForToken: async (data: {
    client_id: string;
    client_secret: string;
    code: string;
    redirect_uri: string;
    grant_type: string;
  }): Promise<OAuthToken> => {
    const response = await apiClient.post('/developer/oauth/token', data);
    return response.data;
  },

  refreshToken: async (data: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
    grant_type: string;
  }): Promise<OAuthToken> => {
    const response = await apiClient.post('/developer/oauth/token', data);
    return response.data;
  },

  // Documentation
  getApiDocumentation: async (): Promise<ApiDocumentation> => {
    const response = await apiClient.get('/developer/docs');
    return response.data;
  },

  // Rate Limits
  getRateLimits: async (): Promise<{
    endpoint: string;
    limit: number;
    remaining: number;
    reset_at: string;
  }[]> => {
    const response = await apiClient.get('/developer/rate-limits');
    return response.data;
  },

  // Logs
  getApiLogs: async (params?: {
    from_date?: string;
    to_date?: string;
    level?: 'error' | 'warn' | 'info';
    limit?: number;
  }): Promise<{
    logs: {
      timestamp: string;
      level: string;
      message: string;
      request_id: string;
      ip_address: string;
      user_agent?: string;
    }[];
    total: number;
  }> => {
    const response = await apiClient.get('/developer/logs', { params });
    return response.data;
  },
};
