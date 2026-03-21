/**
 * src/api/developer.ts
 * Backend-aligned developer adapters
 */
import { request, unsupportedApi } from './client';

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
  status?: string;
  tier?: string;
}

interface RawCreatedDeveloperApp {
  id?: string | number;
  client_id?: string;
  client_secret?: string;
  name?: string;
  scopes?: string[];
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
  scopes: [],
  is_active: (app.status ?? 'ACTIVE') === 'ACTIVE',
  created_at: nowIso(),
  created_by: 'current_user',
});

const mapAppToOAuth = (app: RawDeveloperApp): OAuthApplication => ({
  client_id: String(app.client_id ?? ''),
  client_secret: '',
  name: app.name ?? 'Developer App',
  description: app.tier ? `Tier: ${app.tier}` : undefined,
  redirect_uris: [],
  scopes: [],
  is_active: (app.status ?? 'ACTIVE') === 'ACTIVE',
  created_at: nowIso(),
  created_by: 'current_user',
});

const getDeveloperApps = () => request<RawDeveloperApp[]>({ url: `${DEVELOPER_BASE}/apps`, method: 'GET' });

export const developerApi = {
  getApiKeys: async (): Promise<ApiKey[]> => {
    const response = await getDeveloperApps();
    return Array.isArray(response) ? response.map(mapAppToApiKey) : [];
  },

  createApiKey: async (data: CreateApiKeyRequest): Promise<ApiKey> => {
    const response = await request<RawCreatedDeveloperApp>({
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

  deleteApiKey: async (_keyId: string): Promise<void> => unsupportedApi('Deleting developer apps'),

  regenerateApiKey: async (_keyId: string): Promise<{ key: string }> => unsupportedApi('Regenerating developer credentials'),

  getWebhooks: async (): Promise<Webhook[]> => [],

  createWebhook: async (_data: CreateWebhookRequest): Promise<Webhook> => unsupportedApi('Developer webhooks'),

  updateWebhook: async (_webhookId: string, _data: Partial<CreateWebhookRequest>): Promise<Webhook> =>
    unsupportedApi('Developer webhooks'),

  deleteWebhook: async (_webhookId: string): Promise<void> => unsupportedApi('Developer webhooks'),

  testWebhook: async (_webhookId: string): Promise<{ success: boolean; message: string }> =>
    unsupportedApi('Developer webhooks'),

  getUsageStats: async (_params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<ApiUsageStats> => ({
    total_requests: 0,
    total_errors: 0,
    avg_response_time: 0,
    top_endpoints: [],
    daily_usage: [],
  }),

  getOAuthApplications: async (): Promise<OAuthApplication[]> => {
    const response = await getDeveloperApps();
    return Array.isArray(response) ? response.map(mapAppToOAuth) : [];
  },

  createOAuthApplication: async (data: CreateOAuthApplicationRequest): Promise<OAuthApplication> => {
    const response = await request<RawCreatedDeveloperApp>({
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

  updateOAuthApplication: async (_clientId: string, _data: Partial<CreateOAuthApplicationRequest>): Promise<OAuthApplication> =>
    unsupportedApi('Updating developer apps'),

  deleteOAuthApplication: async (_clientId: string): Promise<void> => unsupportedApi('Deleting developer apps'),

  regenerateClientSecret: async (_clientId: string): Promise<{ client_secret: string }> =>
    unsupportedApi('Regenerating client secrets'),

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
        path: '/api/v1/developer/marketplace',
        method: 'GET',
        description: 'List approved marketplace applications.',
        response: { status: 200, schema: { type: 'array' } },
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
    limit: number;
    remaining: number;
    reset_at: string;
  }[]> => [],

  getApiLogs: async (_params?: {
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
  }> => ({
    logs: [],
    total: 0,
  }),
};
