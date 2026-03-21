/**
 * src/pages/WhatsApp.tsx
 * WhatsApp Integration Dashboard
 */
import { useState } from 'react';
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
import { backendCapabilities } from '@/config/backendCapabilities';
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
  const [showCreateTemplateDialog, setShowCreateTemplateDialog] = useState(false);
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false);
  const [showDeleteCampaignDialog, setShowDeleteCampaignDialog] = useState(false);
  const [showOptDialog, setShowOptDialog] = useState(false);

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

  // Check if user is owner or staff
  const user = authStore.getState().user;
  const canManage = user?.role === 'owner' || user?.role === 'staff';
  const tabs = ([
    'overview',
    'messages',
    'templates',
    ...(backendCapabilities.whatsapp.campaigns ? (['campaigns'] as const) : []),
    'settings',
  ] as const);

  // Queries
  const { data: config, isLoading: configLoading, error: configError } = useWhatsAppConfigQuery();
  const { data: templates, isLoading: templatesLoading } = useWhatsAppTemplatesQuery();
  const { data: messages, isLoading: messagesLoading } = useWhatsAppMessagesQuery(
    searchQuery ? { to: searchQuery } : undefined
  );
  const { data: campaigns, isLoading: campaignsLoading } = useWhatsAppCampaignsQuery();
  const { data: analytics, isLoading: _analyticsLoading } = useWhatsAppAnalyticsQuery();

  // Mutations
  const _updateConfigMutation = useUpdateWhatsAppConfigMutation();
  const createTemplateMutation = useCreateWhatsAppTemplateMutation();
  const sendMessageMutation = useSendWhatsAppMessageMutation();
  const _sendBulkMessageMutation = useSendBulkWhatsAppMessagesMutation();
  const createCampaignMutation = useCreateWhatsAppCampaignMutation();
  const _updateCampaignMutation = useUpdateWhatsAppCampaignMutation();
  const deleteCampaignMutation = useDeleteWhatsAppCampaignMutation();
  const sendCampaignMutation = useSendWhatsAppCampaignMutation();
  const optInMutation = useOptInCustomerMutation();
  const optOutMutation = useOptOutCustomerMutation();
  const _sendTestMutation = useSendTestWhatsAppMessageMutation();

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
                    <div className="col-span-full rounded-md bg-gray-50 p-4 text-sm text-gray-600">
                      This deployment supports WhatsApp configuration, template visibility, and delivery logs. Message
                      sending, template creation, campaigns, and opt-in management are not exposed by the backend.
                    </div>
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
            {canManage && backendCapabilities.whatsapp.arbitraryMessaging && (
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
            {canManage && backendCapabilities.whatsapp.templateCreation && (
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
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {!backendCapabilities.whatsapp.campaigns ? (
                <EmptyState
                  title="Campaigns Not Available"
                  body="The deployed backend does not implement WhatsApp campaign management endpoints."
                />
              ) : campaignsLoading ? (
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
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number ID</label>
                <Input value={config.phone_number_id} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                <Input value={config.webhook_url} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Template Namespace</label>
                <Input value={config.template_namespace || 'Not configured'} disabled />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send Message Dialog */}
      <ConfirmDialog
        open={backendCapabilities.whatsapp.arbitraryMessaging && showSendMessageDialog}
        title="Send Message"
        body="Compose your WhatsApp message"
        confirmLabel={sendMessageMutation.isPending ? 'Sending...' : 'Send'}
        onConfirm={handleSendMessage}
        onCancel={() => {
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
      />

      {/* Create Template Dialog */}
      <ConfirmDialog
        open={backendCapabilities.whatsapp.templateCreation && showCreateTemplateDialog}
        title="Create Template"
        body="Create a new WhatsApp message template"
        confirmLabel={createTemplateMutation.isPending ? 'Creating...' : 'Create'}
        onConfirm={handleCreateTemplate}
        onCancel={() => {
          setShowCreateTemplateDialog(false);
          setTemplateForm({
            name: '',
            category: 'UTILITY',
            language: 'en',
            body: '',
          });
        }}
      />

      {/* Create Campaign Dialog */}
      <ConfirmDialog
        open={backendCapabilities.whatsapp.campaigns && showCreateCampaignDialog}
        title="Create Campaign"
        body="Create a new WhatsApp campaign"
        confirmLabel={createCampaignMutation.isPending ? 'Creating...' : 'Create'}
        onConfirm={handleCreateCampaign}
        onCancel={() => {
          setShowCreateCampaignDialog(false);
          setCampaignForm({
            name: '',
            description: '',
            template_id: '',
            recipients: '',
            scheduled_at: '',
          });
        }}
      />

      {/* Delete Campaign Dialog */}
      <ConfirmDialog
        open={backendCapabilities.whatsapp.campaigns && showDeleteCampaignDialog}
        title="Delete Campaign"
        body={`Are you sure you want to delete campaign "${selectedCampaign?.name}"?`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCampaign}
        onCancel={() => {
          setShowDeleteCampaignDialog(false);
          setSelectedCampaign(null);
        }}
      />

      {/* Opt-in/Out Dialog */}
      <ConfirmDialog
        open={backendCapabilities.whatsapp.optInManagement && showOptDialog}
        title="Manage Customer Opt-in/Out"
        body="Enter customer phone number and select action"
        confirmLabel={optInMutation.isPending || optOutMutation.isPending ? 'Processing...' : 'Submit'}
        onConfirm={handleOptAction}
        onCancel={() => {
          setShowOptDialog(false);
          setOptForm({ phone: '', action: 'opt-in' });
        }}
      />
    </PageFrame>
  );
}
