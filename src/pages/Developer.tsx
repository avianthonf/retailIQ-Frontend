import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  useApiDocumentationQuery,
  useApiKeysQuery,
  useCreateApiKeyMutation,
  useCreateOAuthApplicationMutation,
  useApiLogsQuery,
  useDeleteApiKeyMutation,
  useDeleteOAuthApplicationMutation,
  useOAuthApplicationsQuery,
  useRateLimitsQuery,
  useRegenerateApiKeyMutation,
  useRegenerateClientSecretMutation,
  useUpdateWebhookMutation,
  useUpdateOAuthApplicationMutation,
  useUsageStatsQuery,
  useWebhooksQuery,
  useCreateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
} from '@/hooks/developer';
import {
  useDeveloperMarketplaceQuery,
  useDeveloperV2InventoryMutation,
  useDeveloperV2SalesMutation,
  useRegisterDeveloperMutation,
} from '@/hooks/developerExtras';
import { normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';
import type { ApiKey, ApiUsageStats, OAuthApplication, Webhook } from '@/api/developer';
import type { DeveloperMarketplaceApp } from '@/api/developerExtras';
import { formatDate } from '@/utils/dates';

type DeveloperTab = 'onboarding' | 'marketplace' | 'api-keys' | 'oauth' | 'webhooks' | 'usage' | 'limits' | 'logs' | 'explorer' | 'docs';

const explorerExamples = {
  inventory: '/api/v2/inventory?store_id=123',
  sales: '/api/v2/sales?store_id=123',
};

export default function DeveloperPage() {
  const addToast = uiStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState<DeveloperTab>('onboarding');
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    email: '',
    organization: '',
  });
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    scopes: 'read:inventory,read:sales',
    expires_at: '',
  });
  const [oauthForm, setOAuthForm] = useState({
    name: '',
    description: '',
    redirect_uris: 'https://example.com/oauth/callback',
    scopes: 'read:inventory,read:sales',
  });
  const [explorerForm, setExplorerForm] = useState({
    oauthToken: '',
    storeId: '',
  });
  const [explorerResult, setExplorerResult] = useState<unknown>(null);
  const [explorerLabel, setExplorerLabel] = useState<string>('');
  const [editingApiKeyId, setEditingApiKeyId] = useState<string | null>(null);
  const [editingOauthClientId, setEditingOauthClientId] = useState<string | null>(null);
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    events: 'inventory.updated,orders.created',
    secret: '',
    name: '',
  });
  const [usageFilters, setUsageFilters] = useState({
    from_date: '',
    to_date: '',
  });
  const [logFilters, setLogFilters] = useState({
    level: '' as '' | 'error' | 'warn' | 'info',
    limit: '50',
  });

  const apiKeysQuery = useApiKeysQuery();
  const oauthAppsQuery = useOAuthApplicationsQuery();
  const docsQuery = useApiDocumentationQuery();
  const marketplaceQuery = useDeveloperMarketplaceQuery();
  const webhooksQuery = useWebhooksQuery();
  const usageQuery = useUsageStatsQuery(usageFilters.from_date || usageFilters.to_date ? {
    from_date: usageFilters.from_date || undefined,
    to_date: usageFilters.to_date || undefined,
  } : undefined);
  const rateLimitsQuery = useRateLimitsQuery();
  const apiLogsQuery = useApiLogsQuery({
    level: logFilters.level || undefined,
    limit: Number(logFilters.limit) || 50,
  });

  const registerMutation = useRegisterDeveloperMutation();
  const createApiKeyMutation = useCreateApiKeyMutation();
  const createOauthMutation = useCreateOAuthApplicationMutation();
  const updateAppMutation = useUpdateOAuthApplicationMutation();
  const deleteApiKeyMutation = useDeleteApiKeyMutation();
  const regenerateApiKeyMutation = useRegenerateApiKeyMutation();
  const deleteOauthMutation = useDeleteOAuthApplicationMutation();
  const regenerateClientSecretMutation = useRegenerateClientSecretMutation();
  const inventoryExplorerMutation = useDeveloperV2InventoryMutation();
  const salesExplorerMutation = useDeveloperV2SalesMutation();
  const createWebhookMutation = useCreateWebhookMutation();
  const updateWebhookMutation = useUpdateWebhookMutation();
  const deleteWebhookMutation = useDeleteWebhookMutation();
  const testWebhookMutation = useTestWebhookMutation();

  const blockingError = apiKeysQuery.error
    ?? oauthAppsQuery.error
    ?? docsQuery.error
    ?? marketplaceQuery.error
    ?? webhooksQuery.error
    ?? usageQuery.error
    ?? rateLimitsQuery.error
    ?? apiLogsQuery.error;
  if (blockingError) {
    return (
      <PageFrame title="Developer API" subtitle="Build integrations against the RetailIQ platform.">
        <ErrorState error={normalizeApiError(blockingError)} />
      </PageFrame>
    );
  }

  const apiKeyColumns: Column<ApiKey>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (apiKey) => (
        <div>
          <div className="font-medium">{apiKey.name}</div>
          <div className="text-sm text-gray-500">{apiKey.key_preview || apiKey.key.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      key: 'scopes',
      header: 'Scopes',
      render: (apiKey) => (
        <div className="flex flex-wrap gap-1">
          {apiKey.scopes.length ? apiKey.scopes.map((scope) => (
            <Badge key={scope} variant="secondary">{scope}</Badge>
          )) : <span className="text-sm text-gray-500">Default scopes</span>}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (apiKey) => formatDate(apiKey.created_at),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (apiKey) => <Badge variant={apiKey.is_active ? 'success' : 'secondary'}>{apiKey.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (apiKey) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingApiKeyId(apiKey.id);
              setApiKeyForm({
                name: apiKey.name,
                scopes: apiKey.scopes.join(', '),
                expires_at: apiKey.expires_at ?? '',
              });
              setActiveTab('api-keys');
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => {
              void regenerateApiKeyMutation.mutateAsync(apiKey.id).then((response) => {
                addToast({ title: 'API key regenerated', message: response.key ? 'A new client secret was issued.' : 'Secret rotation completed.', variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Regeneration failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={regenerateApiKeyMutation.isPending}
          >
            Regenerate
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              void deleteApiKeyMutation.mutateAsync(apiKey.id).then(() => {
                addToast({ title: 'API key deleted', message: apiKey.name, variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Delete failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={deleteApiKeyMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const oauthColumns: Column<OAuthApplication>[] = [
    {
      key: 'name',
      header: 'Application',
      render: (app) => (
        <div>
          <div className="font-medium">{app.name}</div>
          <div className="text-sm text-gray-500">{app.description || 'No description'}</div>
        </div>
      ),
    },
    {
      key: 'client_id',
      header: 'Client ID',
      render: (app) => <code className="text-sm">{app.client_id}</code>,
    },
    {
      key: 'redirect_uris',
      header: 'Redirect URIs',
      render: (app) => (
        <div className="space-y-1">
          {app.redirect_uris.length ? app.redirect_uris.map((uri) => (
            <div key={uri} className="text-sm text-gray-600">{uri}</div>
          )) : <span className="text-sm text-gray-500">No redirect URIs</span>}
        </div>
      ),
    },
    {
      key: 'client_secret',
      header: 'Client Secret',
      render: (app) => (
        <code className="text-sm break-all">{app.client_secret || 'Returned only at creation time'}</code>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (app) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingOauthClientId(app.client_id);
              setOAuthForm({
                name: app.name,
                description: app.description ?? '',
                redirect_uris: app.redirect_uris.join(', '),
                scopes: app.scopes.join(', '),
              });
              setActiveTab('oauth');
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => {
              void regenerateClientSecretMutation.mutateAsync(app.client_id).then(() => {
                addToast({ title: 'Client secret regenerated', message: app.name, variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Secret rotation failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={regenerateClientSecretMutation.isPending}
          >
            Regenerate
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              void deleteOauthMutation.mutateAsync(app.client_id).then(() => {
                addToast({ title: 'OAuth app deleted', message: app.name, variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Delete failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={deleteOauthMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const webhookColumns: Column<Webhook>[] = [
    { key: 'name', header: 'Webhook', render: (webhook) => webhook.id ? `${webhook.id}` : webhook.url },
    { key: 'url', header: 'URL', render: (webhook) => webhook.url },
    {
      key: 'events',
      header: 'Events',
      render: (webhook) => (
        <div className="flex flex-wrap gap-1">
          {webhook.events.length ? webhook.events.map((event) => (
            <Badge key={event} variant="secondary">{event}</Badge>
          )) : <span className="text-sm text-gray-500">No events</span>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (webhook) => <Badge variant={webhook.is_active ? 'success' : 'secondary'}>{webhook.is_active ? 'Active' : 'Inactive'}</Badge>,
    },
    { key: 'created_at', header: 'Created', render: (webhook) => formatDate(webhook.created_at) },
    {
      key: 'actions',
      header: 'Actions',
      render: (webhook) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingWebhookId(webhook.id);
              setWebhookForm({
                url: webhook.url,
                events: webhook.events.join(', '),
                secret: webhook.secret,
                name: webhook.id,
              });
              setActiveTab('webhooks');
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            onClick={() => {
              void testWebhookMutation.mutateAsync(webhook.id).then(() => {
                addToast({ title: 'Webhook test queued', message: webhook.url, variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Webhook test failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={testWebhookMutation.isPending}
          >
            Test
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              void deleteWebhookMutation.mutateAsync(webhook.id).then(() => {
                addToast({ title: 'Webhook deleted', message: webhook.url, variant: 'success' });
              }).catch((error) => {
                addToast({ title: 'Delete failed', message: normalizeApiError(error).message, variant: 'error' });
              });
            }}
            loading={deleteWebhookMutation.isPending}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const usageColumns: Column<ApiUsageStats['daily_usage'][number]>[] = [
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    { key: 'requests', header: 'Requests', render: (row) => row.requests.toLocaleString() },
    { key: 'errors', header: 'Errors', render: (row) => row.errors.toLocaleString() },
    { key: 'avg_response_time', header: 'Avg Response', render: (row) => `${row.avg_response_time.toFixed(2)} ms` },
  ];

  const rateLimitColumns: Column<{ endpoint: string; client_id: string; limit: number; remaining: number; reset_at: string }>[] = [
    { key: 'endpoint', header: 'Endpoint', render: (row) => row.endpoint },
    { key: 'client_id', header: 'Client', render: (row) => <code className="text-xs">{row.client_id}</code> },
    { key: 'limit', header: 'Limit', render: (row) => row.limit.toLocaleString() },
    { key: 'remaining', header: 'Remaining', render: (row) => row.remaining.toLocaleString() },
    { key: 'reset_at', header: 'Resets', render: (row) => formatDate(row.reset_at) },
  ];

  const logColumns: Column<{ timestamp: string; level: string; message: string; request_id: string; ip_address: string; user_agent?: string }>[] = [
    { key: 'timestamp', header: 'Time', render: (row) => formatDate(row.timestamp) },
    { key: 'level', header: 'Level', render: (row) => <Badge variant={row.level === 'error' ? 'danger' : row.level === 'warn' ? 'warning' : 'info'}>{row.level}</Badge> },
    { key: 'message', header: 'Message', render: (row) => row.message },
    { key: 'request_id', header: 'Request ID', render: (row) => row.request_id },
    { key: 'ip_address', header: 'Source', render: (row) => row.ip_address },
  ];

  const marketplaceColumns: Column<DeveloperMarketplaceApp>[] = [
    {
      key: 'name',
      header: 'App',
      render: (app) => (
        <div>
          <div className="font-medium">{app.name}</div>
          <div className="text-sm text-gray-500">{app.tagline}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (app) => <Badge variant="info">{app.category}</Badge>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (app) => app.price,
    },
    {
      key: 'install_count',
      header: 'Installs',
      render: (app) => app.install_count.toLocaleString(),
    },
    {
      key: 'avg_rating',
      header: 'Rating',
      render: (app) => app.avg_rating,
    },
  ];

  const parseCsv = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const handleRegisterDeveloper = async () => {
    try {
      const response = await registerMutation.mutateAsync({
        name: registrationForm.name,
        email: registrationForm.email,
        organization: registrationForm.organization || undefined,
      });
      addToast({
        title: 'Developer registered',
        message: response.message,
        variant: 'success',
      });
      setRegistrationForm({ name: '', email: '', organization: '' });
      setActiveTab('api-keys');
    } catch (error) {
      addToast({
        title: 'Registration failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };

  const handleCreateApiKey = async () => {
    try {
      if (editingApiKeyId) {
        await updateAppMutation.mutateAsync({
          clientId: editingApiKeyId,
          data: {
            name: apiKeyForm.name,
            scopes: parseCsv(apiKeyForm.scopes),
            redirect_uris: [],
          },
        });
      } else {
        await createApiKeyMutation.mutateAsync({
          name: apiKeyForm.name,
          scopes: parseCsv(apiKeyForm.scopes),
          expires_at: apiKeyForm.expires_at || undefined,
        });
      }
      addToast({
        title: editingApiKeyId ? 'API key updated' : 'API key created',
        message: editingApiKeyId ? 'The developer app was updated successfully.' : 'The backend issued a new client preview.',
        variant: 'success',
      });
      setApiKeyForm({ name: '', scopes: 'read:inventory,read:sales', expires_at: '' });
      setEditingApiKeyId(null);
    } catch (error) {
      addToast({
        title: editingApiKeyId ? 'API key update failed' : 'API key creation failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };
  const handleCreateOauth = async () => {
    try {
      if (editingOauthClientId) {
        await updateAppMutation.mutateAsync({
          clientId: editingOauthClientId,
          data: {
            name: oauthForm.name,
            description: oauthForm.description || undefined,
            redirect_uris: parseCsv(oauthForm.redirect_uris),
            scopes: parseCsv(oauthForm.scopes),
          },
        });
      } else {
        await createOauthMutation.mutateAsync({
          name: oauthForm.name,
          description: oauthForm.description || undefined,
          redirect_uris: parseCsv(oauthForm.redirect_uris),
          scopes: parseCsv(oauthForm.scopes),
        });
      }
      addToast({
        title: editingOauthClientId ? 'OAuth application updated' : 'OAuth application created',
        message: editingOauthClientId ? 'The OAuth application was updated successfully.' : 'A new client ID was issued.',
        variant: 'success',
      });
      setOAuthForm({
        name: '',
        description: '',
        redirect_uris: 'https://example.com/oauth/callback',
        scopes: 'read:inventory,read:sales',
      });
      setEditingOauthClientId(null);
    } catch (error) {
      addToast({
        title: editingOauthClientId ? 'OAuth app update failed' : 'OAuth app creation failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };

  const handleSaveWebhook = async () => {
    try {
      if (editingWebhookId) {
        await updateWebhookMutation.mutateAsync({
          webhookId: editingWebhookId,
          data: {
            url: webhookForm.url,
            events: parseCsv(webhookForm.events),
            secret: webhookForm.secret || undefined,
          },
        });
      } else {
        await createWebhookMutation.mutateAsync({
          url: webhookForm.url,
          events: parseCsv(webhookForm.events),
          secret: webhookForm.secret || undefined,
          name: webhookForm.name || undefined,
        });
      }

      addToast({
        title: editingWebhookId ? 'Webhook updated' : 'Webhook created',
        message: 'The backend webhook configuration was saved successfully.',
        variant: 'success',
      });
      setWebhookForm({ url: '', events: 'inventory.updated,orders.created', secret: '', name: '' });
      setEditingWebhookId(null);
    } catch (error) {
      addToast({
        title: editingWebhookId ? 'Webhook update failed' : 'Webhook creation failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };
  const runExplorer = async (kind: 'inventory' | 'sales') => {
    try {
      const mutation = kind === 'inventory' ? inventoryExplorerMutation : salesExplorerMutation;
      const result = await mutation.mutateAsync({
        oauthToken: explorerForm.oauthToken,
        storeId: explorerForm.storeId,
      });
      setExplorerLabel(kind === 'inventory' ? explorerExamples.inventory : explorerExamples.sales);
      setExplorerResult(result);
      addToast({
        title: 'Explorer request complete',
        message: `Received ${result.status} from ${kind} endpoint.`,
        variant: 'success',
      });
    } catch (error) {
      const normalized = normalizeApiError(error);
      setExplorerLabel(kind === 'inventory' ? explorerExamples.inventory : explorerExamples.sales);
      setExplorerResult({ error: normalized });
      addToast({
        title: 'Explorer request failed',
        message: normalized.message,
        variant: 'error',
      });
    }
  };

  const isLoading =
    apiKeysQuery.isLoading
    || oauthAppsQuery.isLoading
    || docsQuery.isLoading
    || marketplaceQuery.isLoading
    || webhooksQuery.isLoading
    || usageQuery.isLoading
    || rateLimitsQuery.isLoading
    || apiLogsQuery.isLoading;

  return (
    <PageFrame title="Developer API" subtitle="Register developers, create credentials, browse the marketplace, and test OAuth-protected APIs.">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex flex-wrap gap-6">
          {(['onboarding', 'marketplace', 'api-keys', 'oauth', 'webhooks', 'usage', 'limits', 'logs', 'explorer', 'docs'] as DeveloperTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'api-keys' ? 'API Keys' : tab}
            </button>
          ))}
        </nav>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonLoader variant="rect" height={180} />
          <SkeletonLoader variant="rect" height={320} />
        </div>
      ) : null}

      {!isLoading && activeTab === 'onboarding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Developer Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Name" value={registrationForm.name} onChange={(event) => setRegistrationForm((current) => ({ ...current, name: event.target.value }))} />
              <Input label="Email" type="email" value={registrationForm.email} onChange={(event) => setRegistrationForm((current) => ({ ...current, email: event.target.value }))} />
              <Input label="Organization" value={registrationForm.organization} onChange={(event) => setRegistrationForm((current) => ({ ...current, organization: event.target.value }))} />
              <Button
                onClick={handleRegisterDeveloper}
                loading={registerMutation.isPending}
                disabled={!registrationForm.name || !registrationForm.email}
              >
                Register developer profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What Happens Next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>1. Register your developer identity with the platform.</p>
              <p>2. Create API keys for server-to-server use or OAuth applications for delegated access.</p>
              <p>3. Use the explorer tab with a valid OAuth access token to test `/api/v2/inventory` and `/api/v2/sales`.</p>
              <p>4. Browse the marketplace feed below to confirm the backend marketplace contract is reachable from the frontend.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'marketplace' && (
        <Card>
          <CardHeader>
            <CardTitle>Developer Marketplace</CardTitle>
          </CardHeader>
          <CardContent>
            {marketplaceQuery.data && marketplaceQuery.data.length > 0 ? (
              <DataTable columns={marketplaceColumns} data={marketplaceQuery.data} />
            ) : (
              <EmptyState title="No marketplace apps" body="The backend returned an empty marketplace catalog." />
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && activeTab === 'api-keys' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingApiKeyId ? 'Edit API Key' : 'Create API Key'}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Name" value={apiKeyForm.name} onChange={(event) => setApiKeyForm((current) => ({ ...current, name: event.target.value }))} />
              <Input label="Scopes (comma separated)" value={apiKeyForm.scopes} onChange={(event) => setApiKeyForm((current) => ({ ...current, scopes: event.target.value }))} />
              <Input label="Expires At (optional)" type="datetime-local" value={apiKeyForm.expires_at} onChange={(event) => setApiKeyForm((current) => ({ ...current, expires_at: event.target.value }))} />
              <div className="md:col-span-3">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleCreateApiKey} loading={createApiKeyMutation.isPending || updateAppMutation.isPending} disabled={!apiKeyForm.name}>
                    {editingApiKeyId ? 'Save API key' : 'Create API key'}
                  </Button>
                  {editingApiKeyId ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingApiKeyId(null);
                        setApiKeyForm({ name: '', scopes: 'read:inventory,read:sales', expires_at: '' });
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {apiKeysQuery.data && apiKeysQuery.data.length > 0 ? (
                <DataTable columns={apiKeyColumns} data={apiKeysQuery.data} />
              ) : (
                <EmptyState title="No API keys" body="Create your first API key to start making signed requests." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'oauth' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingOauthClientId ? 'Edit OAuth Application' : 'Create OAuth Application'}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Application name" value={oauthForm.name} onChange={(event) => setOAuthForm((current) => ({ ...current, name: event.target.value }))} />
              <Input label="Description" value={oauthForm.description} onChange={(event) => setOAuthForm((current) => ({ ...current, description: event.target.value }))} />
              <Input label="Redirect URIs (comma separated)" value={oauthForm.redirect_uris} onChange={(event) => setOAuthForm((current) => ({ ...current, redirect_uris: event.target.value }))} />
              <Input label="Scopes (comma separated)" value={oauthForm.scopes} onChange={(event) => setOAuthForm((current) => ({ ...current, scopes: event.target.value }))} />
              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleCreateOauth} loading={createOauthMutation.isPending || updateAppMutation.isPending} disabled={!oauthForm.name || !oauthForm.redirect_uris}>
                    {editingOauthClientId ? 'Save OAuth application' : 'Create OAuth application'}
                  </Button>
                  {editingOauthClientId ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingOauthClientId(null);
                        setOAuthForm({
                          name: '',
                          description: '',
                          redirect_uris: 'https://example.com/oauth/callback',
                          scopes: 'read:inventory,read:sales',
                        });
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OAuth Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {oauthAppsQuery.data && oauthAppsQuery.data.length > 0 ? (
                <DataTable columns={oauthColumns} data={oauthAppsQuery.data} />
              ) : (
                <EmptyState title="No OAuth applications" body="Create an OAuth application to test delegated RetailIQ access." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'webhooks' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingWebhookId ? 'Edit Webhook' : 'Create Webhook'}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="URL" value={webhookForm.url} onChange={(event) => setWebhookForm((current) => ({ ...current, url: event.target.value }))} />
              <Input label="Events (comma separated)" value={webhookForm.events} onChange={(event) => setWebhookForm((current) => ({ ...current, events: event.target.value }))} />
              <Input label="Secret (optional)" value={webhookForm.secret} onChange={(event) => setWebhookForm((current) => ({ ...current, secret: event.target.value }))} />
              <Input label="Label" value={webhookForm.name} onChange={(event) => setWebhookForm((current) => ({ ...current, name: event.target.value }))} />
              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSaveWebhook} loading={createWebhookMutation.isPending || updateWebhookMutation.isPending} disabled={!webhookForm.url || !webhookForm.events}>
                    {editingWebhookId ? 'Save webhook' : 'Create webhook'}
                  </Button>
                  {editingWebhookId ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingWebhookId(null);
                        setWebhookForm({ url: '', events: 'inventory.updated,orders.created', secret: '', name: '' });
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configured Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              {webhooksQuery.data && webhooksQuery.data.length > 0 ? (
                <DataTable columns={webhookColumns} data={webhooksQuery.data} />
              ) : (
                <EmptyState title="No webhooks configured" body="Create a webhook to connect your app to backend event delivery." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'usage' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="From date" type="date" value={usageFilters.from_date} onChange={(event) => setUsageFilters((current) => ({ ...current, from_date: event.target.value }))} />
              <Input label="To date" type="date" value={usageFilters.to_date} onChange={(event) => setUsageFilters((current) => ({ ...current, to_date: event.target.value }))} />
              <div className="flex items-end">
                <Button variant="secondary" onClick={() => void usageQuery.refetch()}>Refresh usage</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">Total requests</div><div className="text-3xl font-semibold">{usageQuery.data?.total_requests?.toLocaleString() ?? 0}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">Total errors</div><div className="text-3xl font-semibold">{usageQuery.data?.total_errors?.toLocaleString() ?? 0}</div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="text-sm text-gray-500">Avg response</div><div className="text-3xl font-semibold">{usageQuery.data?.avg_response_time?.toFixed(2) ?? '0.00'} ms</div></CardContent></Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              {usageQuery.data?.top_endpoints?.length ? (
                <div className="space-y-3">
                  {usageQuery.data.top_endpoints.map((endpoint) => (
                    <div key={endpoint.path} className="flex items-center justify-between rounded-md border p-3">
                      <code className="text-sm">{endpoint.path}</code>
                      <Badge variant="info">{endpoint.requests.toLocaleString()} requests</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No endpoint usage" body="The backend has not returned usage records for the selected period." />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={usageColumns} data={usageQuery.data?.daily_usage ?? []} emptyMessage="No daily usage data returned by the backend." />
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'limits' && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={rateLimitColumns} data={rateLimitsQuery.data ?? []} emptyMessage="No rate-limit records returned by the backend." />
          </CardContent>
        </Card>
      )}

      {!isLoading && activeTab === 'logs' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Log Filters</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Level</label>
                <select
                  value={logFilters.level}
                  onChange={(event) => setLogFilters((current) => ({ ...current, level: event.target.value as typeof logFilters.level }))}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="">All</option>
                  <option value="error">Error</option>
                  <option value="warn">Warn</option>
                  <option value="info">Info</option>
                </select>
              </div>
              <Input label="Limit" type="number" value={logFilters.limit} onChange={(event) => setLogFilters((current) => ({ ...current, limit: event.target.value }))} />
              <div className="flex items-end">
                <Button variant="secondary" onClick={() => void apiLogsQuery.refetch()}>Refresh logs</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={logColumns} data={apiLogsQuery.data?.logs ?? []} emptyMessage="No API logs returned by the backend." />
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'explorer' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Explorer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Paste a valid OAuth access token minted by one of your applications and the merchant `store_id` you want
                to query. This frontend will call the protected backend v2 routes directly.
              </p>
              <Input label="OAuth access token" value={explorerForm.oauthToken} onChange={(event) => setExplorerForm((current) => ({ ...current, oauthToken: event.target.value }))} />
              <Input label="Store ID" value={explorerForm.storeId} onChange={(event) => setExplorerForm((current) => ({ ...current, storeId: event.target.value }))} />
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void runExplorer('inventory')} loading={inventoryExplorerMutation.isPending} disabled={!explorerForm.oauthToken || !explorerForm.storeId}>
                  Fetch Inventory
                </Button>
                <Button variant="secondary" onClick={() => void runExplorer('sales')} loading={salesExplorerMutation.isPending} disabled={!explorerForm.oauthToken || !explorerForm.storeId}>
                  Fetch Sales
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Explorer Result</CardTitle>
            </CardHeader>
            <CardContent>
              {explorerResult ? (
                <div className="space-y-3">
                  <Badge variant="info">{explorerLabel}</Badge>
                  <pre className="bg-gray-50 rounded-md p-4 text-sm overflow-auto">{JSON.stringify(explorerResult, null, 2)}</pre>
                </div>
              ) : (
                <EmptyState title="No explorer response yet" body="Run one of the OAuth-protected backend requests to inspect the live envelope and payload." />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!isLoading && activeTab === 'docs' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Base URL</div>
                <code className="block bg-gray-50 rounded-md p-3 text-sm">{docsQuery.data?.base_url || 'Unavailable'}</code>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Authentication</div>
                <p className="text-sm text-gray-700">{docsQuery.data?.authentication.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documented Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              {docsQuery.data?.endpoints?.length ? (
                <div className="space-y-3">
                  {docsQuery.data.endpoints.map((endpoint) => (
                    <div key={`${endpoint.method}-${endpoint.path}`} className="rounded-md border border-gray-200 p-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="primary">{endpoint.method}</Badge>
                        <code className="text-sm">{endpoint.path}</code>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{endpoint.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No docs available" body="The backend did not return in-app endpoint documentation." />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  );
}

