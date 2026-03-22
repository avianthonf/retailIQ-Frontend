/**
 * src/api/developer.ts
 * Backend-aligned developer adapters
 */
import { request } from './client';

const DEVELOPER_BASE = '/api/v1/developer';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  key_preview: string;
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
  name?: string;
  app_id?: string;
  client_id?: string;
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

export interface OAuthAuthorizationRequest {
  client_id: string;
  app_name: string;
  description?: string;
  redirect_uri: string;
  scopes: string[];
  state?: string;
}

export interface OAuthAuthorizationApproval {
  redirect_url: string;
  code: string;
  state?: string;
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
      schema: Record<string, unknown>;
    };
  }[];
}

interface RawDeveloperApp {
  id?: string | number;
  name?: string;
  client_id?: string;
  client_secret?: string;
  description?: string;
  app_type?: string;
  redirect_uris?: string[];
  scopes?: string[];
  status?: string;
  tier?: string;
  created_at?: string;
}

interface RawWebhook {
  id?: string | number;
  app_id?: string | number;
  client_id?: string;
  name?: string;
  url?: string;
  events?: string[];
  secret?: string;
  is_active?: boolean;
  last_triggered_at?: string | null;
  created_at?: string;
  created_by?: string;
}

const nowIso = () => new Date().toISOString();

const getBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (configured) {
    return configured;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

const mapAppToApiKey = (app: RawDeveloperApp): ApiKey => ({
  id: String(app.id ?? app.client_id ?? ''),
  name: app.name ?? 'Developer App',
  key: String(app.client_id ?? ''),
  key_preview: String(app.client_id ?? '').slice(0, 8),
  scopes: Array.isArray(app.scopes) ? app.scopes : [],
  is_active: (app.status ?? 'ACTIVE') === 'ACTIVE',
  created_at: app.created_at ?? nowIso(),
  created_by: 'current_user',
});

const mapAppToOAuth = (app: RawDeveloperApp): OAuthApplication => ({
  client_id: String(app.client_id ?? ''),
  client_secret: String(app.client_secret ?? ''),
  name: app.name ?? 'Developer App',
  description: app.description ?? (app.tier ? `Tier: ${app.tier}` : undefined),
  redirect_uris: Array.isArray(app.redirect_uris) ? app.redirect_uris : [],
  scopes: Array.isArray(app.scopes) ? app.scopes : [],
  is_active: (app.status ?? 'ACTIVE') === 'ACTIVE',
  created_at: app.created_at ?? nowIso(),
  created_by: 'current_user',
});

const mapWebhook = (webhook: RawWebhook): Webhook => ({
  id: String(webhook.id ?? webhook.app_id ?? webhook.client_id ?? ''),
  url: webhook.url ?? '',
  events: Array.isArray(webhook.events) ? webhook.events : [],
  secret: webhook.secret ?? '',
  is_active: webhook.is_active ?? true,
  last_triggered_at: webhook.last_triggered_at ?? undefined,
  created_at: webhook.created_at ?? nowIso(),
  created_by: webhook.created_by ?? 'current_user',
});

const getDeveloperApps = () => request<RawDeveloperApp[]>({ url: `${DEVELOPER_BASE}/apps`, method: 'GET' });

export const developerApi = {
  getApiKeys: async (): Promise<ApiKey[]> => {
    const response = await getDeveloperApps();
    return Array.isArray(response)
      ? response
          .filter((app) => app.app_type !== 'WEB' && app.app_type !== 'MOBILE')
          .map(mapAppToApiKey)
      : [];
  },

  createApiKey: async (data: CreateApiKeyRequest): Promise<ApiKey> => {
    const response = await request<RawDeveloperApp>({
      url: `${DEVELOPER_BASE}/apps`,
      method: 'POST',
      data: {
        name: data.name,
        description: 'API key style backend integration',
        app_type: 'BACKEND',
        redirect_uris: [],
        scopes: data.scopes,
      },
    });

    return {
      id: String(response.id ?? response.client_id ?? ''),
      name: response.name ?? data.name,
      key: String(response.client_secret ?? ''),
      key_preview: String(response.client_id ?? '').slice(0, 8),
      scopes: Array.isArray(response.scopes) ? response.scopes : data.scopes,
      is_active: true,
      expires_at: data.expires_at,
      created_at: nowIso(),
      created_by: 'current_user',
    };
  },

  deleteApiKey: async (keyId: string): Promise<void> => {
    await request<{ id: string; deleted: boolean }>({
      url: `${DEVELOPER_BASE}/apps/${keyId}`,
      method: 'DELETE',
    });
  },

  regenerateApiKey: async (keyId: string): Promise<{ key: string }> => {
    const response = await request<{ client_secret?: string }>({
      url: `${DEVELOPER_BASE}/apps/${keyId}/regenerate-secret`,
      method: 'POST',
    });
    return {
      key: String(response.client_secret ?? ''),
    };
  },

  getWebhooks: async (): Promise<Webhook[]> => {
    const response = await request<RawWebhook[]>({
      url: `${DEVELOPER_BASE}/webhooks`,
      method: 'GET',
    });
    return Array.isArray(response) ? response.map(mapWebhook) : [];
  },

  createWebhook: async (data: CreateWebhookRequest): Promise<Webhook> => {
    const response = await request<RawWebhook>({
      url: `${DEVELOPER_BASE}/webhooks`,
      method: 'POST',
      data,
    });
    return mapWebhook(response);
  },

  updateWebhook: async (webhookId: string, data: Partial<CreateWebhookRequest>): Promise<Webhook> => {
    const response = await request<RawWebhook>({
      url: `${DEVELOPER_BASE}/webhooks/${webhookId}`,
      method: 'PATCH',
      data,
    });
    return mapWebhook(response);
  },

  deleteWebhook: async (webhookId: string): Promise<void> => {
    await request<{ id: string; deleted: boolean }>({
      url: `${DEVELOPER_BASE}/webhooks/${webhookId}`,
      method: 'DELETE',
    });
  },

  testWebhook: async (webhookId: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>({
      url: `${DEVELOPER_BASE}/webhooks/${webhookId}/test`,
      method: 'POST',
    }),

  getUsageStats: async (params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<ApiUsageStats> =>
    request<ApiUsageStats>({
      url: `${DEVELOPER_BASE}/usage`,
      method: 'GET',
      params,
    }),

  getOAuthApplications: async (): Promise<OAuthApplication[]> => {
    const response = await getDeveloperApps();
    return Array.isArray(response)
      ? response
          .filter((app) => app.app_type === 'WEB' || app.app_type === 'MOBILE')
          .map(mapAppToOAuth)
      : [];
  },

  createOAuthApplication: async (data: CreateOAuthApplicationRequest): Promise<OAuthApplication> => {
    const response = await request<RawDeveloperApp>({
      url: `${DEVELOPER_BASE}/apps`,
      method: 'POST',
      data: {
        name: data.name,
        description: data.description,
        app_type: 'WEB',
        redirect_uris: data.redirect_uris,
        scopes: data.scopes,
      },
    });

    return {
      client_id: String(response.client_id ?? ''),
      client_secret: String(response.client_secret ?? ''),
      name: response.name ?? data.name,
      description: data.description,
      redirect_uris: data.redirect_uris,
      scopes: Array.isArray(response.scopes) ? response.scopes : data.scopes,
      is_active: true,
      created_at: nowIso(),
      created_by: 'current_user',
    };
  },

  updateOAuthApplication: async (clientId: string, data: Partial<CreateOAuthApplicationRequest>): Promise<OAuthApplication> => {
    const response = await request<RawDeveloperApp>({
      url: `${DEVELOPER_BASE}/apps/${clientId}`,
      method: 'PATCH',
      data,
    });
    return mapAppToOAuth(response);
  },

  deleteOAuthApplication: async (clientId: string): Promise<void> => {
    await request<{ id: string; deleted: boolean }>({
      url: `${DEVELOPER_BASE}/apps/${clientId}`,
      method: 'DELETE',
    });
  },

  regenerateClientSecret: async (clientId: string): Promise<{ client_secret: string }> =>
    request<{ client_secret: string }>({
      url: `${DEVELOPER_BASE}/apps/${clientId}/regenerate-secret`,
      method: 'POST',
    }),

  authorize: async (params: {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
    state?: string;
  }): Promise<OAuthAuthorizationRequest> =>
    request<OAuthAuthorizationRequest>({
      url: '/oauth/authorize',
      method: 'GET',
      params,
    }),

  approveAuthorizationRequest: async (params: {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
    state?: string;
  }): Promise<OAuthAuthorizationApproval> =>
    request<OAuthAuthorizationApproval>({
      url: '/oauth/authorize',
      method: 'POST',
      params,
      data: { confirm: true },
    }),

  exchangeCodeForToken: async (data: {
    client_id: string;
    client_secret: string;
    code: string;
    redirect_uri: string;
    grant_type: string;
  }): Promise<OAuthToken> => request<OAuthToken>({ url: '/oauth/token', method: 'POST', data }),

  refreshToken: async (data: {
    client_id: string;
    client_secret: string;
    refresh_token: string;
    grant_type: string;
  }): Promise<OAuthToken> => request<OAuthToken>({ url: '/oauth/token', method: 'POST', data }),

  getApiDocumentation: async (): Promise<ApiDocumentation> => ({
    version: 'backend-source',
    base_url: getBaseUrl(),
    authentication: {
      type: 'oauth',
      description: 'Use developer applications or OAuth client credentials supported by the backend.',
    },
    endpoints: [
      {
        path: '/api/v1/developer/apps',
        method: 'GET',
        description: 'List developer applications for the current user.',
        response: { status: 200, schema: { type: 'array' } },
      },
      {
        path: '/api/v1/developer/apps',
        method: 'POST',
        description: 'Create a developer application.',
        response: { status: 201, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/apps/<app_ref>',
        method: 'PATCH',
        description: 'Update a developer application or API key configuration.',
        response: { status: 200, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/apps/<app_ref>',
        method: 'DELETE',
        description: 'Delete a developer application or API key.',
        response: { status: 200, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/apps/<app_ref>/regenerate-secret',
        method: 'POST',
        description: 'Rotate a developer application client secret.',
        response: { status: 200, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/marketplace',
        method: 'GET',
        description: 'List approved marketplace applications.',
        response: { status: 200, schema: { type: 'array' } },
      },
      {
        path: '/api/v1/developer/webhooks',
        method: 'GET',
        description: 'List configured developer webhooks.',
        response: { status: 200, schema: { type: 'array' } },
      },
      {
        path: '/api/v1/developer/webhooks',
        method: 'POST',
        description: 'Create a developer webhook subscription.',
        response: { status: 201, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/webhooks/<app_ref>',
        method: 'PATCH',
        description: 'Update a developer webhook subscription.',
        response: { status: 200, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/webhooks/<app_ref>',
        method: 'DELETE',
        description: 'Delete a developer webhook subscription.',
        response: { status: 200, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/webhooks/<app_ref>/test',
        method: 'POST',
        description: 'Queue a webhook delivery test.',
        response: { status: 200, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/usage',
        method: 'GET',
        description: 'Inspect aggregated developer usage statistics.',
        response: { status: 200, schema: { type: 'object' } },
      },
      {
        path: '/api/v1/developer/rate-limits',
        method: 'GET',
        description: 'Inspect current developer app rate limits.',
        response: { status: 200, schema: { type: 'array' } },
      },
      {
        path: '/api/v1/developer/logs',
        method: 'GET',
        description: 'Inspect recent developer-facing API and webhook logs.',
        response: { status: 200, schema: { type: 'object' } },
      },
      {
        path: '/oauth/authorize',
        method: 'GET',
        description: 'Start the OAuth authorization flow.',
        response: { status: 302, schema: { type: 'redirect' } },
      },
      {
        path: '/oauth/token',
        method: 'POST',
        description: 'Exchange authorization codes or refresh tokens.',
        response: { status: 200, schema: { type: 'object' } },
      },
    ],
  }),

  getRateLimits: async (): Promise<{
    endpoint: string;
    client_id: string;
    limit: number;
    remaining: number;
    reset_at: string;
  }[]> =>
    request<{
      endpoint: string;
      client_id: string;
      limit: number;
      remaining: number;
      reset_at: string;
    }[]>({
      url: `${DEVELOPER_BASE}/rate-limits`,
      method: 'GET',
    }),

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
  }> =>
    request<{
      logs: {
        timestamp: string;
        level: string;
        message: string;
        request_id: string;
        ip_address: string;
        user_agent?: string;
      }[];
      total: number;
    }>({
      url: `${DEVELOPER_BASE}/logs`,
      method: 'GET',
      params,
    }),
};
