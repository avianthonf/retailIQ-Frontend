/**
 * src/pages/Developer.tsx
 * Developer API Dashboard
 */
import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState as _ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Input as _Input } from '@/components/ui/Input';
import { 
  useApiKeysQuery,
  useWebhooksQuery,
  useUsageStatsQuery,
  useOAuthApplicationsQuery,
  useApiDocumentationQuery,
  useRateLimitsQuery,
  useApiLogsQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
  useRegenerateApiKeyMutation,
  useCreateWebhookMutation,
  useUpdateWebhookMutation,
  useDeleteWebhookMutation,
  useTestWebhookMutation,
  useCreateOAuthApplicationMutation,
  useUpdateOAuthApplicationMutation,
  useDeleteOAuthApplicationMutation,
  useRegenerateClientSecretMutation
} from '@/hooks/developer';
import { authStore } from '@/stores/authStore';
import { backendCapabilities } from '@/config/backendCapabilities';
import type { Column } from '@/components/ui/DataTable';
import type { ApiKey, Webhook, OAuthApplication } from '@/api/developer';
import { formatDate } from '@/utils/dates';
import { normalizeApiError as _normalizeApiError } from '@/utils/errors';
import type { ApiError as _ApiError } from '@/types/api';

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'api-keys' | 'webhooks' | 'oauth' | 'docs' | 'logs'>('overview');
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [selectedOAuthApp, setSelectedOAuthApp] = useState<OAuthApplication | null>(null);
  const [showCreateApiKeyDialog, setShowCreateApiKeyDialog] = useState(false);
  const [showCreateWebhookDialog, setShowCreateWebhookDialog] = useState(false);
  const [showCreateOAuthDialog, setShowCreateOAuthDialog] = useState(false);
  const [showDeleteApiKeyDialog, setShowDeleteApiKeyDialog] = useState(false);
  const [showDeleteWebhookDialog, setShowDeleteWebhookDialog] = useState(false);
  const [showDeleteOAuthDialog, setShowDeleteOAuthDialog] = useState(false);

  // Form states
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    scopes: [] as string[],
    expires_at: '',
  });
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    events: [] as string[],
    secret: '',
  });
  const [oauthForm, setOAuthForm] = useState({
    name: '',
    description: '',
    redirect_uris: [] as string[],
    scopes: [] as string[],
  });

  // Check if user is owner or staff
  const user = authStore.getState().user;
  const canManage = user?.role === 'owner' || user?.role === 'staff';
  const tabs = ([
    'overview',
    'api-keys',
    ...(backendCapabilities.developer.webhooks ? (['webhooks'] as const) : []),
    'oauth',
    'docs',
    'logs',
  ] as const);

  // Queries
  const { data: apiKeys, isLoading: apiKeysLoading } = useApiKeysQuery();
  const { data: webhooks, isLoading: webhooksLoading } = useWebhooksQuery();
  const { data: usageStats, isLoading: usageLoading } = useUsageStatsQuery();
  const { data: oauthApps, isLoading: oauthLoading } = useOAuthApplicationsQuery();
  const { data: docs, isLoading: docsLoading } = useApiDocumentationQuery();
  const { data: _rateLimits, isLoading: _rateLimitsLoading } = useRateLimitsQuery();
  const { data: logs, isLoading: logsLoading } = useApiLogsQuery();

  // Mutations
  const createApiKeyMutation = useCreateApiKeyMutation();
  const deleteApiKeyMutation = useDeleteApiKeyMutation();
  const _regenerateApiKeyMutation = useRegenerateApiKeyMutation();
  const createWebhookMutation = useCreateWebhookMutation();
  const _updateWebhookMutation = useUpdateWebhookMutation();
  const deleteWebhookMutation = useDeleteWebhookMutation();
  const _testWebhookMutation = useTestWebhookMutation();
  const createOAuthMutation = useCreateOAuthApplicationMutation();
  const _updateOAuthMutation = useUpdateOAuthApplicationMutation();
  const deleteOAuthMutation = useDeleteOAuthApplicationMutation();
  const _regenerateSecretMutation = useRegenerateClientSecretMutation();

  // Handlers
  const handleCreateApiKey = async () => {
    if (!apiKeyForm.name || apiKeyForm.scopes.length === 0) return;
    
    try {
      await createApiKeyMutation.mutateAsync(apiKeyForm);
      setShowCreateApiKeyDialog(false);
      setApiKeyForm({ name: '', scopes: [], expires_at: '' });
      alert('API key created successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.url || webhookForm.events.length === 0) return;
    
    try {
      await createWebhookMutation.mutateAsync(webhookForm);
      setShowCreateWebhookDialog(false);
      setWebhookForm({ url: '', events: [], secret: '' });
      alert('Webhook created successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleCreateOAuth = async () => {
    if (!oauthForm.name || oauthForm.redirect_uris.length === 0) return;
    
    try {
      await createOAuthMutation.mutateAsync(oauthForm);
      setShowCreateOAuthDialog(false);
      setOAuthForm({ name: '', description: '', redirect_uris: [], scopes: [] });
      alert('OAuth application created successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteApiKey = async () => {
    if (!selectedApiKey) return;
    
    try {
      await deleteApiKeyMutation.mutateAsync(selectedApiKey.id);
      setShowDeleteApiKeyDialog(false);
      setSelectedApiKey(null);
      alert('API key deleted successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteWebhook = async () => {
    if (!selectedWebhook) return;
    
    try {
      await deleteWebhookMutation.mutateAsync(selectedWebhook.id);
      setShowDeleteWebhookDialog(false);
      setSelectedWebhook(null);
      alert('Webhook deleted successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteOAuth = async () => {
    if (!selectedOAuthApp) return;
    
    try {
      await deleteOAuthMutation.mutateAsync(selectedOAuthApp.client_id);
      setShowDeleteOAuthDialog(false);
      setSelectedOAuthApp(null);
      alert('OAuth application deleted successfully');
    } catch {
      // Error handled by mutation
    }
  };

  // API Key columns
  const apiKeyColumns: Column<ApiKey>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (apiKey) => (
        <div>
          <div className="font-medium">{apiKey.name}</div>
          <div className="text-sm text-gray-500">{apiKey.key_preview}...</div>
        </div>
      ),
    },
    {
      key: 'scopes',
      header: 'Scopes',
      render: (apiKey) => (
        <div className="flex flex-wrap gap-1">
          {apiKey.scopes.map((scope) => (
            <Badge key={scope} variant="secondary" className="text-xs">
              {scope}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (apiKey) => (
        <Badge variant={apiKey.is_active ? 'success' : 'secondary'}>
          {apiKey.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'last_used_at',
      header: 'Last Used',
      render: (apiKey) => apiKey.last_used_at ? formatDate(apiKey.last_used_at) : 'Never',
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (apiKey) => formatDate(apiKey.created_at),
    },
  ];

  // Webhook columns
  const webhookColumns: Column<Webhook>[] = [
    {
      key: 'url',
      header: 'URL',
      render: (webhook) => webhook.url,
    },
    {
      key: 'events',
      header: 'Events',
      render: (webhook) => (
        <div className="flex flex-wrap gap-1">
          {webhook.events.map((event) => (
            <Badge key={event} variant="secondary" className="text-xs">
              {event}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (webhook) => (
        <Badge variant={webhook.is_active ? 'success' : 'secondary'}>
          {webhook.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'last_triggered_at',
      header: 'Last Triggered',
      render: (webhook) => webhook.last_triggered_at ? formatDate(webhook.last_triggered_at) : 'Never',
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (webhook) => formatDate(webhook.created_at),
    },
  ];

  // OAuth columns
  const oauthColumns: Column<OAuthApplication>[] = [
    {
      key: 'name',
      header: 'Application',
      render: (app) => (
        <div>
          <div className="font-medium">{app.name}</div>
          {app.description && (
            <div className="text-sm text-gray-500">{app.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'client_id',
      header: 'Client ID',
      render: (app) => (
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
          {app.client_id}
        </code>
      ),
    },
    {
      key: 'redirect_uris',
      header: 'Redirect URIs',
      render: (app) => (
        <div className="space-y-1">
          {app.redirect_uris.slice(0, 2).map((uri) => (
            <div key={uri} className="text-sm text-gray-600 truncate">
              {uri}
            </div>
          ))}
          {app.redirect_uris.length > 2 && (
            <div className="text-sm text-gray-500">
              +{app.redirect_uris.length - 2} more
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (app) => (
        <Badge variant={app.is_active ? 'success' : 'secondary'}>
          {app.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (app) => formatDate(app.created_at),
    },
  ];

  return (
    <PageFrame title="Developer API">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'docs' ? 'API Documentation' : tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Usage Stats */}
          {usageLoading ? (
            <SkeletonLoader width="100%" height="200px" variant="rect" />
          ) : usageStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageStats.total_requests.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Error Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {usageStats.total_requests > 0 
                      ? `${((usageStats.total_errors / usageStats.total_requests) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{usageStats.avg_response_time.toFixed(0)}ms</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">Active Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{apiKeys?.filter(k => k.is_active).length || 0}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {canManage && (
                  <>
                    <Button variant="primary" onClick={() => setShowCreateApiKeyDialog(true)}>
                      Create API Key
                    </Button>
                    {backendCapabilities.developer.webhooks && (
                      <Button variant="primary" onClick={() => setShowCreateWebhookDialog(true)}>
                        Create Webhook
                      </Button>
                    )}
                    <Button variant="primary" onClick={() => setShowCreateOAuthDialog(true)}>
                      Create OAuth App
                    </Button>
                    <Button variant="secondary" onClick={() => setActiveTab('docs')}>
                      View API Guide
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Endpoints */}
          {usageStats && usageStats.top_endpoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {usageStats.top_endpoints.map((endpoint, index) => (
                    <div key={endpoint.path} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <code className="text-sm">{endpoint.path}</code>
                      </div>
                      <span className="text-sm font-medium">{endpoint.requests.toLocaleString()} requests</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            {canManage && (
              <Button variant="primary" onClick={() => setShowCreateApiKeyDialog(true)}>
                Create API Key
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {apiKeysLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : apiKeys && apiKeys.length > 0 ? (
                <DataTable
                  columns={apiKeyColumns}
                  data={apiKeys}
                />
              ) : (
                <EmptyState
                  title="No API Keys"
                  body="Create an API key to start accessing the API."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              {!backendCapabilities.developer.webhooks ? (
                <EmptyState
                  title="Webhooks Not Available"
                  body="The current backend deployment does not expose developer webhook management endpoints."
                />
              ) : webhooksLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : webhooks && webhooks.length > 0 ? (
                <DataTable
                  columns={webhookColumns}
                  data={webhooks}
                />
              ) : (
                <EmptyState
                  title="No Webhooks"
                  body="Create webhooks to receive real-time event notifications."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* OAuth Tab */}
      {activeTab === 'oauth' && (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            {canManage && (
              <Button variant="primary" onClick={() => setShowCreateOAuthDialog(true)}>
                Create OAuth Application
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>OAuth Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {oauthLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : oauthApps && oauthApps.length > 0 ? (
                <DataTable
                  columns={oauthColumns}
                  data={oauthApps}
                />
              ) : (
                <EmptyState
                  title="No OAuth Applications"
                  body="Create OAuth applications for third-party integrations."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <Card>
          <CardHeader>
            <CardTitle>API Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : docs ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Getting Started</h3>
                  <p className="text-gray-600 mb-4">
                    Use your API keys to authenticate requests to the RetailIQ API. 
                    Include the key in the Authorization header: <code>Bearer YOUR_API_KEY</code>
                  </p>
                  {!backendCapabilities.developer.standaloneDocs && (
                    <p className="text-sm text-gray-500">
                      This backend does not publish a standalone `/api/v1/docs` route, so this in-app guide is the
                      supported documentation surface for deployment.
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Base URL</h3>
                  <code className="block bg-gray-100 p-3 rounded">{docs.base_url}</code>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Available Endpoints</h3>
                  <div className="space-y-2">
                    {docs.endpoints.slice(0, 5).map((endpoint) => (
                      <div key={endpoint.path} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <Badge variant="primary" className="mb-1">{endpoint.method}</Badge>
                          <code className="text-sm ml-2">{endpoint.path}</code>
                        </div>
                        <span className="text-sm text-gray-600">{endpoint.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Documentation Not Available"
                body="API documentation is currently unavailable."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle>API Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : logs && logs.logs.length > 0 ? (
              <div className="space-y-2">
                {logs.logs.map((log) => (
                  <div key={`${log.timestamp}-${log.request_id}`} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          log.level === 'error' ? 'danger' :
                          log.level === 'warn' ? 'warning' :
                          'info'
                        }>
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatDate(log.timestamp)}</span>
                        <code className="text-xs bg-gray-200 px-2 py-1">{log.request_id}</code>
                      </div>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    <p className="text-xs text-gray-500 mt-1">IP: {log.ip_address}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Logs"
                body="No API logs found for the selected period."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Create API Key Dialog */}
      <ConfirmDialog
        open={showCreateApiKeyDialog}
        title="Create API Key"
        body="Create a new API key for programmatic access"
        confirmLabel={createApiKeyMutation.isPending ? 'Creating...' : 'Create'}
        onConfirm={handleCreateApiKey}
        onCancel={() => {
          setShowCreateApiKeyDialog(false);
          setApiKeyForm({ name: '', scopes: [], expires_at: '' });
        }}
      />

      {/* Create Webhook Dialog */}
      <ConfirmDialog
        open={showCreateWebhookDialog}
        title="Create Webhook"
        body="Create a new webhook to receive event notifications"
        confirmLabel={createWebhookMutation.isPending ? 'Creating...' : 'Create'}
        onConfirm={handleCreateWebhook}
        onCancel={() => {
          setShowCreateWebhookDialog(false);
          setWebhookForm({ url: '', events: [], secret: '' });
        }}
      />

      {/* Create OAuth Dialog */}
      <ConfirmDialog
        open={showCreateOAuthDialog}
        title="Create OAuth Application"
        body="Create a new OAuth application for third-party integrations"
        confirmLabel={createOAuthMutation.isPending ? 'Creating...' : 'Create'}
        onConfirm={handleCreateOAuth}
        onCancel={() => {
          setShowCreateOAuthDialog(false);
          setOAuthForm({ name: '', description: '', redirect_uris: [], scopes: [] });
        }}
      />

      {/* Delete API Key Dialog */}
      <ConfirmDialog
        open={showDeleteApiKeyDialog}
        title="Delete API Key"
        body={`Are you sure you want to delete API key "${selectedApiKey?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteApiKey}
        onCancel={() => {
          setShowDeleteApiKeyDialog(false);
          setSelectedApiKey(null);
        }}
      />

      {/* Delete Webhook Dialog */}
      <ConfirmDialog
        open={showDeleteWebhookDialog}
        title="Delete Webhook"
        body={`Are you sure you want to delete webhook for "${selectedWebhook?.url}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteWebhook}
        onCancel={() => {
          setShowDeleteWebhookDialog(false);
          setSelectedWebhook(null);
        }}
      />

      {/* Delete OAuth Dialog */}
      <ConfirmDialog
        open={showDeleteOAuthDialog}
        title="Delete OAuth Application"
        body={`Are you sure you want to delete OAuth application "${selectedOAuthApp?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteOAuth}
        onCancel={() => {
          setShowDeleteOAuthDialog(false);
          setSelectedOAuthApp(null);
        }}
      />
    </PageFrame>
  );
}
