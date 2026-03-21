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
  useOAuthApplicationsQuery,
} from '@/hooks/developer';
import {
  useDeveloperMarketplaceQuery,
  useDeveloperV2InventoryMutation,
  useDeveloperV2SalesMutation,
  useRegisterDeveloperMutation,
} from '@/hooks/developerExtras';
import { normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';
import type { ApiKey, OAuthApplication } from '@/api/developer';
import type { DeveloperMarketplaceApp } from '@/api/developerExtras';
import { formatDate } from '@/utils/dates';

type DeveloperTab = 'onboarding' | 'marketplace' | 'api-keys' | 'oauth' | 'explorer' | 'docs';

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

  const apiKeysQuery = useApiKeysQuery();
  const oauthAppsQuery = useOAuthApplicationsQuery();
  const docsQuery = useApiDocumentationQuery();
  const marketplaceQuery = useDeveloperMarketplaceQuery();

  const registerMutation = useRegisterDeveloperMutation();
  const createApiKeyMutation = useCreateApiKeyMutation();
  const createOauthMutation = useCreateOAuthApplicationMutation();
  const inventoryExplorerMutation = useDeveloperV2InventoryMutation();
  const salesExplorerMutation = useDeveloperV2SalesMutation();

  const blockingError = apiKeysQuery.error ?? oauthAppsQuery.error ?? docsQuery.error ?? marketplaceQuery.error;
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
      const key = await createApiKeyMutation.mutateAsync({
        name: apiKeyForm.name,
        scopes: parseCsv(apiKeyForm.scopes),
        expires_at: apiKeyForm.expires_at || undefined,
      });
      addToast({
        title: 'API key created',
        message: `Client preview ${key.key_preview}…`,
        variant: 'success',
      });
      setApiKeyForm({ name: '', scopes: 'read:inventory,read:sales', expires_at: '' });
    } catch (error) {
      addToast({
        title: 'API key creation failed',
        message: normalizeApiError(error).message,
        variant: 'error',
      });
    }
  };

  const handleCreateOauth = async () => {
    try {
      const app = await createOauthMutation.mutateAsync({
        name: oauthForm.name,
        description: oauthForm.description || undefined,
        redirect_uris: parseCsv(oauthForm.redirect_uris),
        scopes: parseCsv(oauthForm.scopes),
      });
      addToast({
        title: 'OAuth application created',
        message: `Client ID ${app.client_id}`,
        variant: 'success',
      });
      setOAuthForm({
        name: '',
        description: '',
        redirect_uris: 'https://example.com/oauth/callback',
        scopes: 'read:inventory,read:sales',
      });
    } catch (error) {
      addToast({
        title: 'OAuth app creation failed',
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

  const isLoading = apiKeysQuery.isLoading || oauthAppsQuery.isLoading || docsQuery.isLoading || marketplaceQuery.isLoading;

  return (
    <PageFrame title="Developer API" subtitle="Register developers, create credentials, browse the marketplace, and test OAuth-protected APIs.">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex flex-wrap gap-6">
          {(['onboarding', 'marketplace', 'api-keys', 'oauth', 'explorer', 'docs'] as DeveloperTab[]).map((tab) => (
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
              <CardTitle>Create API Key</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Name" value={apiKeyForm.name} onChange={(event) => setApiKeyForm((current) => ({ ...current, name: event.target.value }))} />
              <Input label="Scopes (comma separated)" value={apiKeyForm.scopes} onChange={(event) => setApiKeyForm((current) => ({ ...current, scopes: event.target.value }))} />
              <Input label="Expires At (optional)" type="datetime-local" value={apiKeyForm.expires_at} onChange={(event) => setApiKeyForm((current) => ({ ...current, expires_at: event.target.value }))} />
              <div className="md:col-span-3">
                <Button onClick={handleCreateApiKey} loading={createApiKeyMutation.isPending} disabled={!apiKeyForm.name}>
                  Create API key
                </Button>
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
              <CardTitle>Create OAuth Application</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Application name" value={oauthForm.name} onChange={(event) => setOAuthForm((current) => ({ ...current, name: event.target.value }))} />
              <Input label="Description" value={oauthForm.description} onChange={(event) => setOAuthForm((current) => ({ ...current, description: event.target.value }))} />
              <Input label="Redirect URIs (comma separated)" value={oauthForm.redirect_uris} onChange={(event) => setOAuthForm((current) => ({ ...current, redirect_uris: event.target.value }))} />
              <Input label="Scopes (comma separated)" value={oauthForm.scopes} onChange={(event) => setOAuthForm((current) => ({ ...current, scopes: event.target.value }))} />
              <div className="md:col-span-2">
                <Button onClick={handleCreateOauth} loading={createOauthMutation.isPending} disabled={!oauthForm.name || !oauthForm.redirect_uris}>
                  Create OAuth application
                </Button>
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
