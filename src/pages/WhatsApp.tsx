/**
 * src/pages/WhatsApp.tsx
 * WhatsApp Integration Dashboard
 */
import { useEffect, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import {
  useWhatsAppConfigQuery,
  useWhatsAppTemplatesQuery,
  useWhatsAppMessagesQuery,
  useWhatsAppCampaignsQuery,
  useWhatsAppAnalyticsQuery,
  useUpdateWhatsAppConfigMutation,
  useCreateWhatsAppTemplateMutation,
  useSendWhatsAppMessageMutation,
  useSendBulkWhatsAppMessagesMutation,
  useCreateWhatsAppCampaignMutation,
  useUpdateWhatsAppCampaignMutation,
  useDeleteWhatsAppCampaignMutation,
  useSendWhatsAppCampaignMutation,
  useOptInCustomerMutation,
  useOptOutCustomerMutation,
  useSendTestWhatsAppMessageMutation
} from '@/hooks/whatsapp';
import { authStore } from '@/stores/authStore';
import type { Column } from '@/components/ui/DataTable';
import type { WhatsAppMessage, WhatsAppCampaign, WhatsAppTemplate } from '@/api/whatsapp';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'templates' | 'campaigns' | 'settings'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [_selectedMessage, _setSelectedMessage] = useState<WhatsAppMessage | null>(null);
  const [showSendMessageDialog, setShowSendMessageDialog] = useState(false);
  const [showBulkSendDialog, setShowBulkSendDialog] = useState(false);
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false);
  const [showDeleteCampaignDialog, setShowDeleteCampaignDialog] = useState(false);
  const [showOptDialog, setShowOptDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [configForm, setConfigForm] = useState({
    phone_number_id: '',
    waba_id: '',
    webhook_secret: '',
    access_token: '',
    is_connected: false,
  });

  // Form states
  const [messageForm, setMessageForm] = useState({
    to: '',
    message_type: 'TEXT' as const,
    content: '',
    template_name: '',
    template_language: 'en',
    template_variables: '{}',
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'UTILITY' as const,
    language: 'en',
    body: '',
  });
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    template_id: '',
    recipients: '',
    scheduled_at: '',
  });
  const [optForm, setOptForm] = useState({
    phone: '',
    action: 'opt-in' as const,
  });
  const [bulkForm, setBulkForm] = useState({
    recipients: '',
    message_type: 'TEXT' as const,
    content: '',
    template_name: '',
    template_language: 'en',
    template_variables: '{}',
  });
  const [testForm, setTestForm] = useState({
    to: '',
    template_name: '',
    template_language: 'en',
    template_variables: '{}',
  });

  // Check if user is owner or staff
  const user = authStore.getState().user;
  const canManage = user?.role === 'owner' || user?.role === 'staff';
  const tabs = (['overview', 'messages', 'templates', 'campaigns', 'settings'] as const);

  // Queries
  const { data: config, isLoading: configLoading, error: configError } = useWhatsAppConfigQuery();
  const { data: templates, isLoading: templatesLoading } = useWhatsAppTemplatesQuery();
  const { data: messages, isLoading: messagesLoading } = useWhatsAppMessagesQuery(
    searchQuery ? { to: searchQuery } : undefined
  );
  const { data: campaigns, isLoading: campaignsLoading } = useWhatsAppCampaignsQuery();
  const { data: analytics, isLoading: _analyticsLoading } = useWhatsAppAnalyticsQuery();

  // Mutations
  const updateConfigMutation = useUpdateWhatsAppConfigMutation();
  const createTemplateMutation = useCreateWhatsAppTemplateMutation();
  const sendMessageMutation = useSendWhatsAppMessageMutation();
  const sendBulkMessageMutation = useSendBulkWhatsAppMessagesMutation();
  const createCampaignMutation = useCreateWhatsAppCampaignMutation();
  const _updateCampaignMutation = useUpdateWhatsAppCampaignMutation();
  const deleteCampaignMutation = useDeleteWhatsAppCampaignMutation();
  const sendCampaignMutation = useSendWhatsAppCampaignMutation();
  const optInMutation = useOptInCustomerMutation();
  const optOutMutation = useOptOutCustomerMutation();
  const sendTestMutation = useSendTestWhatsAppMessageMutation();

  useEffect(() => {
    if (config) {
      setConfigForm({
        phone_number_id: config.phone_number_id ?? '',
        waba_id: config.template_namespace ?? '',
        webhook_secret: config.webhook_secret ?? '',
        access_token: config.access_token ?? '',
        is_connected: config.is_connected,
      });
    }
  }, [config]);

  // Handlers
  const handleSendMessage = async () => {
    if (!messageForm.to || !messageForm.content) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        ...messageForm,
        template_variables: JSON.parse(messageForm.template_variables || '{}'),
      });
      setShowSendMessageDialog(false);
      setMessageForm({
        to: '',
        message_type: 'TEXT',
        content: '',
        template_name: '',
        template_language: 'en',
        template_variables: '{}',
      });
      alert('Message sent successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.body) return;
    
    try {
      await createTemplateMutation.mutateAsync({
        ...templateForm,
        components: [
          {
            type: 'BODY',
            text: templateForm.body,
          },
        ],
      });
      setShowCreateTemplateDialog(false);
      setTemplateForm({
        name: '',
        category: 'UTILITY',
        language: 'en',
        body: '',
      });
      alert('Template created successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.template_id || !campaignForm.recipients) return;
    
    try {
      await createCampaignMutation.mutateAsync({
        ...campaignForm,
        recipients: campaignForm.recipients.split(',').map(r => r.trim()).filter(Boolean),
      });
      setShowCreateCampaignDialog(false);
      setCampaignForm({
        name: '',
        description: '',
        template_id: '',
        recipients: '',
        scheduled_at: '',
      });
      alert('Campaign created successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleBulkSend = async () => {
    if (!bulkForm.recipients || !bulkForm.content) return;

    try {
      await sendBulkMessageMutation.mutateAsync(
        bulkForm.recipients.split(',').map((recipient) => ({
          to: recipient.trim(),
          message_type: bulkForm.message_type,
          content: bulkForm.content,
          template_name: bulkForm.template_name || undefined,
          template_language: bulkForm.template_language,
          template_variables: JSON.parse(bulkForm.template_variables || '{}'),
        })).filter((entry) => entry.to),
      );
      setShowBulkSendDialog(false);
      setBulkForm({
        recipients: '',
        message_type: 'TEXT',
        content: '',
        template_name: '',
        template_language: 'en',
        template_variables: '{}',
      });
      alert('Bulk messages sent successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleTestMessage = async () => {
    if (!testForm.to || !testForm.template_name) return;

    try {
      await sendTestMutation.mutateAsync({
        to: testForm.to,
        template_name: testForm.template_name,
        template_language: testForm.template_language,
        template_variables: JSON.parse(testForm.template_variables || '{}'),
      });
      setShowTestDialog(false);
      setTestForm({
        to: '',
        template_name: '',
        template_language: 'en',
        template_variables: '{}',
      });
      alert('Test message sent successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleUpdateConfig = async () => {
    try {
      await updateConfigMutation.mutateAsync({
        phone_number_id: configForm.phone_number_id,
        template_namespace: configForm.waba_id,
        webhook_secret: configForm.webhook_secret,
        access_token: configForm.access_token,
        is_connected: configForm.is_connected,
      });
      alert('WhatsApp settings updated successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;
    
    try {
      await deleteCampaignMutation.mutateAsync(selectedCampaign.id);
      setShowDeleteCampaignDialog(false);
      setSelectedCampaign(null);
      alert('Campaign deleted successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await sendCampaignMutation.mutateAsync(campaignId);
      alert('Campaign sent successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleOptAction = async () => {
    if (!optForm.phone) return;
    
    try {
      if (optForm.action === 'opt-in') {
        await optInMutation.mutateAsync(optForm.phone);
      } else {
        await optOutMutation.mutateAsync(optForm.phone);
      }
      setShowOptDialog(false);
      setOptForm({ phone: '', action: 'opt-in' });
      alert(`Customer ${optForm.action} successful`);
    } catch {
      // Error handled by mutation
    }
  };

  // Message columns
  const messageColumns: Column<WhatsAppMessage>[] = [
    {
      key: 'to',
      header: 'To',
      render: (message) => message.to,
    },
    {
      key: 'message_type',
      header: 'Type',
      render: (message) => (
        <Badge variant="primary">{message.message_type}</Badge>
      ),
    },
    {
      key: 'content',
      header: 'Content',
      render: (message) => (
        <div className="max-w-xs truncate">
          {message.content}
          {message.template_name && (
            <div className="text-sm text-gray-500">Template: {message.template_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (message) => (
        <Badge variant={
          message.status === 'DELIVERED' ? 'success' :
          message.status === 'READ' ? 'success' :
          message.status === 'FAILED' ? 'danger' :
          message.status === 'PENDING' ? 'warning' :
          'secondary'
        }>
          {message.status}
        </Badge>
      ),
    },
    {
      key: 'sent_at',
      header: 'Sent At',
      render: (message) => formatDate(message.sent_at),
    },
  ];

  // Campaign columns
  const campaignColumns: Column<WhatsAppCampaign>[] = [
    {
      key: 'name',
      header: 'Campaign',
      render: (campaign) => (
        <div>
          <div className="font-medium">{campaign.name}</div>
          <div className="text-sm text-gray-500">{campaign.description}</div>
        </div>
      ),
    },
    {
      key: 'template_name',
      header: 'Template',
      render: (campaign) => campaign.template_name,
    },
    {
      key: 'recipient_count',
      header: 'Recipients',
      render: (campaign) => campaign.recipient_count.toLocaleString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (campaign) => (
        <Badge variant={
          campaign.status === 'COMPLETED' ? 'success' :
          campaign.status === 'SENDING' ? 'warning' :
          campaign.status === 'FAILED' ? 'danger' :
          campaign.status === 'SCHEDULED' ? 'info' :
          'secondary'
        }>
          {campaign.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (campaign) => formatDate(campaign.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (campaign) => (
        <div className="flex space-x-2">
          {campaign.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSendCampaign(campaign.id)}
            >
              Send
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedCampaign(campaign)}
          >
            View
          </Button>
          {campaign.status === 'DRAFT' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSelectedCampaign(campaign);
                setShowDeleteCampaignDialog(true);
              }}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Template columns
  const templateColumns: Column<WhatsAppTemplate>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (template) => template.name,
    },
    {
      key: 'category',
      header: 'Category',
      render: (template) => (
        <Badge variant="primary">{template.category}</Badge>
      ),
    },
    {
      key: 'language',
      header: 'Language',
      render: (template) => template.language.toUpperCase(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (template) => (
        <Badge variant={
          template.status === 'APPROVED' ? 'success' :
          template.status === 'REJECTED' ? 'danger' :
          'warning'
        }>
          {template.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (template) => formatDate(template.created_at),
    },
  ];

  if (configLoading) {
    return (
      <PageFrame title="WhatsApp Integration">
        <div className="space-y-6">
          <SkeletonLoader width="100%" height="200px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (configError) {
    return (
      <PageFrame title="WhatsApp Integration">
        <ErrorState error={normalizeApiError(configError as unknown as ApiError)} />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="WhatsApp Integration">
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
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && config && analytics && (
        <div className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">{config.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge variant={config.is_connected ? 'success' : 'danger'}>
                    {config.is_connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verification</p>
                  <Badge variant={config.is_verified ? 'success' : 'warning'}>
                    {config.is_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business Name</p>
                  <p className="font-medium">{config.business_name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_messages.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(analytics.delivery_rate * 100).toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Read Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(analytics.read_rate * 100).toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {canManage && (
                  <>
                    <Button variant="primary" onClick={() => setShowSendMessageDialog(true)}>
                      Send Message
                    </Button>
                    <Button variant="secondary" onClick={() => setShowBulkSendDialog(true)}>
                      Bulk Send
                    </Button>
                    <Button variant="secondary" onClick={() => setShowCreateTemplateDialog(true)}>
                      Create Template
                    </Button>
                    <Button variant="secondary" onClick={() => setShowCreateCampaignDialog(true)}>
                      Create Campaign
                    </Button>
                    <Button variant="secondary" onClick={() => setShowTestDialog(true)}>
                      Test Message
                    </Button>
                    <Button variant="secondary" onClick={() => setShowOptDialog(true)}>
                      Manage Opt-In
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            {canManage && (
              <Button variant="primary" onClick={() => setShowSendMessageDialog(true)}>
                Send Message
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : messages && messages.messages.length > 0 ? (
                <DataTable
                  columns={messageColumns}
                  data={messages.messages}
                />
              ) : (
                <EmptyState
                  title="No Messages"
                  body="No messages sent yet."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            {canManage && (
              <Button variant="primary" onClick={() => setShowCreateTemplateDialog(true)}>
                Create Template
              </Button>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : templates && templates.length > 0 ? (
                <DataTable
                  columns={templateColumns}
                  data={templates}
                />
              ) : (
                <EmptyState
                  title="No Templates"
                  body="No message templates created."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {canManage && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setShowCreateCampaignDialog(true)}>
                Create Campaign
              </Button>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : campaigns && campaigns.length > 0 ? (
                <DataTable
                  columns={campaignColumns}
                  data={campaigns}
                />
              ) : (
                <EmptyState
                  title="No Campaigns"
                  body="No campaigns created."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && config && canManage && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Phone Number ID" value={configForm.phone_number_id} onChange={(event) => setConfigForm((current) => ({ ...current, phone_number_id: event.target.value }))} />
              <Input label="WABA ID" value={configForm.waba_id} onChange={(event) => setConfigForm((current) => ({ ...current, waba_id: event.target.value }))} />
              <Input label="Webhook Secret" value={configForm.webhook_secret} onChange={(event) => setConfigForm((current) => ({ ...current, webhook_secret: event.target.value }))} />
              <Input label="Access Token" value={configForm.access_token} onChange={(event) => setConfigForm((current) => ({ ...current, access_token: event.target.value }))} />
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={configForm.is_connected}
                  onChange={(event) => setConfigForm((current) => ({ ...current, is_connected: event.target.checked }))}
                />
                Mark integration as connected
              </label>
              <div className="md:col-span-2">
                <Button onClick={handleUpdateConfig} loading={updateConfigMutation.isPending}>
                  Save settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Connection Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div><span className="text-gray-500">Webhook URL:</span> {config.webhook_url}</div>
              <div><span className="text-gray-500">Verification:</span> {config.is_verified ? 'Verified' : 'Pending'}</div>
              <div><span className="text-gray-500">Connected:</span> {config.is_connected ? 'Yes' : 'No'}</div>
              <div><span className="text-gray-500">Namespace:</span> {config.template_namespace || 'Not configured'}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {showSendMessageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full space-y-4">
            <h2 className="text-lg font-bold">Send Message</h2>
            <Input
              label="Recipient"
              value={messageForm.to}
              onChange={(event) => setMessageForm((current) => ({ ...current, to: event.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
              <select
                value={messageForm.message_type}
                onChange={(event) => setMessageForm((current) => ({ ...current, message_type: event.target.value as typeof current.message_type }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="TEXT">Text</option>
                <option value="TEMPLATE">Template</option>
                <option value="IMAGE">Image</option>
                <option value="DOCUMENT">Document</option>
              </select>
            </div>
            <Input
              label="Content"
              value={messageForm.content}
              onChange={(event) => setMessageForm((current) => ({ ...current, content: event.target.value }))}
            />
            <Input
              label="Template Name"
              value={messageForm.template_name}
              onChange={(event) => setMessageForm((current) => ({ ...current, template_name: event.target.value }))}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSendMessageDialog(false);
                  setMessageForm({
                    to: '',
                    message_type: 'TEXT',
                    content: '',
                    template_name: '',
                    template_language: 'en',
                    template_variables: '{}',
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSendMessage} loading={sendMessageMutation.isPending}>
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {showBulkSendDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full space-y-4">
            <h2 className="text-lg font-bold">Bulk Send Messages</h2>
            <Input
              label="Recipients (comma separated)"
              value={bulkForm.recipients}
              onChange={(event) => setBulkForm((current) => ({ ...current, recipients: event.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
              <select
                value={bulkForm.message_type}
                onChange={(event) => setBulkForm((current) => ({ ...current, message_type: event.target.value as typeof current.message_type }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="TEXT">Text</option>
                <option value="TEMPLATE">Template</option>
              </select>
            </div>
            <Input
              label="Content"
              value={bulkForm.content}
              onChange={(event) => setBulkForm((current) => ({ ...current, content: event.target.value }))}
            />
            <Input
              label="Template Name"
              value={bulkForm.template_name}
              onChange={(event) => setBulkForm((current) => ({ ...current, template_name: event.target.value }))}
            />
            <Input
              label="Template Language"
              value={bulkForm.template_language}
              onChange={(event) => setBulkForm((current) => ({ ...current, template_language: event.target.value }))}
            />
            <Input
              label="Template Variables (JSON)"
              value={bulkForm.template_variables}
              onChange={(event) => setBulkForm((current) => ({ ...current, template_variables: event.target.value }))}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowBulkSendDialog(false);
                  setBulkForm({
                    recipients: '',
                    message_type: 'TEXT',
                    content: '',
                    template_name: '',
                    template_language: 'en',
                    template_variables: '{}',
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleBulkSend} loading={sendBulkMessageMutation.isPending}>
                Send bulk
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCreateTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full space-y-4">
            <h2 className="text-lg font-bold">Create Template</h2>
            <Input
              label="Name"
              value={templateForm.name}
              onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(event) => setTemplateForm((current) => ({ ...current, category: event.target.value as typeof current.category }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="UTILITY">Utility</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
              <Input
                label="Language"
                value={templateForm.language}
                onChange={(event) => setTemplateForm((current) => ({ ...current, language: event.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={templateForm.body}
                onChange={(event) => setTemplateForm((current) => ({ ...current, body: event.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateTemplateDialog(false);
                  setTemplateForm({
                    name: '',
                    category: 'UTILITY',
                    language: 'en',
                    body: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} loading={createTemplateMutation.isPending}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {showTestDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full space-y-4">
            <h2 className="text-lg font-bold">Send Test Message</h2>
            <Input
              label="Recipient"
              value={testForm.to}
              onChange={(event) => setTestForm((current) => ({ ...current, to: event.target.value }))}
            />
            <Input
              label="Template Name"
              value={testForm.template_name}
              onChange={(event) => setTestForm((current) => ({ ...current, template_name: event.target.value }))}
            />
            <Input
              label="Template Language"
              value={testForm.template_language}
              onChange={(event) => setTestForm((current) => ({ ...current, template_language: event.target.value }))}
            />
            <Input
              label="Template Variables (JSON)"
              value={testForm.template_variables}
              onChange={(event) => setTestForm((current) => ({ ...current, template_variables: event.target.value }))}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowTestDialog(false);
                  setTestForm({
                    to: '',
                    template_name: '',
                    template_language: 'en',
                    template_variables: '{}',
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleTestMessage} loading={sendTestMutation.isPending}>
                Send test
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCreateCampaignDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full space-y-4">
            <h2 className="text-lg font-bold">Create Campaign</h2>
            <Input
              label="Name"
              value={campaignForm.name}
              onChange={(event) => setCampaignForm((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              label="Description"
              value={campaignForm.description}
              onChange={(event) => setCampaignForm((current) => ({ ...current, description: event.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
              <select
                value={campaignForm.template_id}
                onChange={(event) => setCampaignForm((current) => ({ ...current, template_id: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select template</option>
                {templates?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Recipients (comma separated)"
              value={campaignForm.recipients}
              onChange={(event) => setCampaignForm((current) => ({ ...current, recipients: event.target.value }))}
            />
            <Input
              label="Schedule (optional)"
              type="datetime-local"
              value={campaignForm.scheduled_at}
              onChange={(event) => setCampaignForm((current) => ({ ...current, scheduled_at: event.target.value }))}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateCampaignDialog(false);
                  setCampaignForm({
                    name: '',
                    description: '',
                    template_id: '',
                    recipients: '',
                    scheduled_at: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} loading={createCampaignMutation.isPending}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Campaign Dialog */}
      <ConfirmDialog
        open={showDeleteCampaignDialog}
        title="Delete Campaign"
        body={`Are you sure you want to delete campaign "${selectedCampaign?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCampaign}
        onCancel={() => {
          setShowDeleteCampaignDialog(false);
          setSelectedCampaign(null);
        }}
      />

      {showOptDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-4">
            <h2 className="text-lg font-bold">Manage Customer Opt-In</h2>
            <Input
              label="Phone"
              value={optForm.phone}
              onChange={(event) => setOptForm((current) => ({ ...current, phone: event.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={optForm.action}
                onChange={(event) => setOptForm((current) => ({ ...current, action: event.target.value as typeof current.action }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="opt-in">Opt In</option>
                <option value="opt-out">Opt Out</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowOptDialog(false);
                  setOptForm({ phone: '', action: 'opt-in' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleOptAction} loading={optInMutation.isPending || optOutMutation.isPending}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageFrame>
  );
}
