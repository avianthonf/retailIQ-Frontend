/**
 * src/api/whatsapp.ts
 * Backend-aligned WhatsApp adapters
 */
import { request, requestEnvelope } from './client';

const WHATSAPP_BASE = '/api/v1/whatsapp';

export interface WhatsAppConfig {
  id: string;
  phone_number_id: string;
  phone_number: string;
  business_name: string;
  webhook_url: string;
  webhook_secret: string;
  is_verified: boolean;
  is_connected: boolean;
  access_token?: string;
  template_namespace?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  components: {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    text?: string;
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    buttons?: {
      type: 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }[];
  }[];
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  to: string;
  from: string;
  message_type: 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO';
  content: string;
  template_name?: string;
  template_language?: string;
  template_variables?: Record<string, string>;
  media_url?: string;
  media_filename?: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  error_message?: string;
  external_id?: string;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface WhatsAppWebhook {
  id: string;
  object: string;
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }[];
  }[];
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  description: string;
  template_id: string;
  template_name: string;
  recipient_count: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'FAILED';
  scheduled_at?: string;
  sent_at?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppAnalytics {
  total_messages: number;
  sent_messages: number;
  delivered_messages: number;
  read_messages: number;
  failed_messages: number;
  delivery_rate: number;
  read_rate: number;
  top_templates: {
    template_name: string;
    usage_count: number;
    delivery_rate: number;
  }[];
  daily_stats: {
    date: string;
    sent: number;
    delivered: number;
    read: number;
  }[];
}

const nowIso = () => new Date().toISOString();

const toDateKey = (value?: string) => (value ? value.slice(0, 10) : nowIso().slice(0, 10));

const mapMessageStatus = (status?: string): WhatsAppMessage['status'] => {
  switch (status) {
    case 'FAILED':
      return 'FAILED';
    case 'SENT':
      return 'SENT';
    case 'DELIVERED':
      return 'DELIVERED';
    case 'READ':
      return 'READ';
    default:
      return 'PENDING';
  }
};

const mapCampaignStatus = (status?: string): WhatsAppCampaign['status'] => {
  switch (status) {
    case 'SCHEDULED':
      return 'SCHEDULED';
    case 'SENDING':
      return 'SENDING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'DRAFT';
  }
};

export const whatsappApi = {
  getConfig: async (): Promise<WhatsAppConfig> => {
    const response = await request<{
      phone_number_id?: string | null;
      waba_id?: string | null;
      is_active?: boolean;
      configured?: boolean;
    }>({
      url: `${WHATSAPP_BASE}/config`,
      method: 'GET',
    });

    return {
      id: 'current',
      phone_number_id: String(response.phone_number_id ?? ''),
      phone_number: String(response.waba_id ?? ''),
      business_name: 'WhatsApp Business',
      webhook_url: '/api/v1/whatsapp/webhook',
      webhook_secret: '',
      is_verified: Boolean(response.configured),
      is_connected: Boolean(response.is_active) && Boolean(response.configured),
      access_token: undefined,
      template_namespace: String(response.waba_id ?? '') || undefined,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
  },

  updateConfig: async (data: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> => {
    await request<{ message?: string }>({
      url: `${WHATSAPP_BASE}/config`,
      method: 'PUT',
      data: {
        phone_number_id: data.phone_number_id,
        waba_id: data.template_namespace,
        webhook_verify_token: data.webhook_secret,
        access_token: data.access_token,
        is_active: data.is_connected ?? true,
      },
    });

    return whatsappApi.getConfig();
  },

  verifyWebhook: async (mode: string, token: string, challenge: string): Promise<string> => {
    return request<string>({
      url: `${WHATSAPP_BASE}/webhook`,
      method: 'GET',
      params: {
        'hub.mode': mode,
        'hub.verify_token': token,
        'hub.challenge': challenge,
      },
    });
  },

  getTemplates: async (): Promise<WhatsAppTemplate[]> => {
    const response = await request<Array<{
      id?: string | number;
      name?: string;
      category?: string;
      language?: string;
      status?: string;
      components?: WhatsAppTemplate['components'];
      created_at?: string;
      updated_at?: string;
    }>>({
      url: `${WHATSAPP_BASE}/templates`,
      method: 'GET',
    });

    return Array.isArray(response)
      ? response.map((template) => ({
          id: String(template.id ?? ''),
          name: template.name ?? '',
          category: template.category === 'MARKETING' || template.category === 'AUTHENTICATION' ? template.category : 'UTILITY',
          language: template.language ?? 'en',
          status: template.status === 'APPROVED' || template.status === 'REJECTED' ? template.status : 'PENDING',
          components: Array.isArray(template.components) ? template.components : [],
          created_at: template.created_at ?? nowIso(),
          updated_at: template.updated_at ?? nowIso(),
        }))
      : [];
  },

  createTemplate: async (data: {
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: WhatsAppTemplate['components'];
  }): Promise<WhatsAppTemplate> => {
    const response = await request<{
      id?: string | number;
      name?: string;
      category?: string;
      language?: string;
      status?: string;
      components?: WhatsAppTemplate['components'];
      created_at?: string;
      updated_at?: string;
    }>({
      url: `${WHATSAPP_BASE}/templates`,
      method: 'POST',
      data,
    });
    return {
      id: String(response.id ?? ''),
      name: response.name ?? data.name,
      category: response.category === 'MARKETING' || response.category === 'AUTHENTICATION' ? response.category : 'UTILITY',
      language: response.language ?? data.language,
      status: response.status === 'APPROVED' || response.status === 'REJECTED' ? response.status : 'PENDING',
      components: Array.isArray(response.components) ? response.components : data.components,
      created_at: response.created_at ?? nowIso(),
      updated_at: response.updated_at ?? nowIso(),
    };
  },

  sendMessage: async (data: {
    to: string;
    message_type: 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT';
    content: string;
    template_name?: string;
    template_language?: string;
    template_variables?: Record<string, string>;
    media_url?: string;
    media_filename?: string;
  }): Promise<WhatsAppMessage> => {
    const response = await request<{
      id?: string | number;
      message_type?: string;
      recipient?: string;
      status?: string;
      sent_at?: string;
      template_name?: string;
      content?: string;
    }>({
      url: `${WHATSAPP_BASE}/messages`,
      method: 'POST',
      data,
    });
    return {
      id: String(response.id ?? ''),
      to: String(response.recipient ?? data.to),
      from: '',
      message_type: data.message_type,
      content: response.content ?? data.content,
      template_name: response.template_name ?? data.template_name,
      template_language: data.template_language,
      template_variables: data.template_variables,
      media_url: data.media_url,
      media_filename: data.media_filename,
      status: mapMessageStatus(response.status),
      sent_at: response.sent_at ?? nowIso(),
      created_at: response.sent_at ?? nowIso(),
    };
  },

  sendBulkMessages: async (messages: Array<{
    to: string;
    message_type: 'TEXT' | 'TEMPLATE';
    content: string;
    template_name?: string;
    template_language?: string;
    template_variables?: Record<string, string>;
  }>): Promise<{
    successful: WhatsAppMessage[];
    failed: { to: string; error: string }[];
  }> => {
    const response = await request<{
      successful?: Array<{ id?: string | number; message_type?: string; recipient?: string; status?: string; sent_at?: string }>;
      failed?: Array<{ to?: string; error?: string }>;
    }>({
      url: `${WHATSAPP_BASE}/messages/bulk`,
      method: 'POST',
      data: { messages },
    });

    return {
      successful: Array.isArray(response.successful)
        ? response.successful.map((message) => ({
            id: String(message.id ?? ''),
            to: String(message.recipient ?? ''),
            from: '',
            message_type: message.message_type === 'template' ? 'TEMPLATE' : 'TEXT',
            content: '',
            status: mapMessageStatus(message.status),
            sent_at: message.sent_at ?? nowIso(),
            created_at: message.sent_at ?? nowIso(),
          }))
        : [],
      failed: Array.isArray(response.failed)
        ? response.failed.map((item) => ({
            to: item.to ?? '',
            error: item.error ?? 'Bulk message failed',
          }))
        : [],
    };
  },

  getMessages: async (params?: {
    to?: string;
    from?: string;
    message_type?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ messages: WhatsAppMessage[]; total: number; page: number; pages: number }> => {
    const envelope = await requestEnvelope<Array<{
      id?: string | number;
      message_type?: string;
      recipient?: string;
      status?: string;
      sent_at?: string;
      template_name?: string;
      content?: string;
    }>>({
      url: `${WHATSAPP_BASE}/message-log`,
      method: 'GET',
      params,
    });

    const rows = Array.isArray(envelope.data) ? envelope.data : [];
    const meta = envelope.meta ?? {};
    const page = Number(meta.page ?? params?.page ?? 1);
    const limit = Number(meta.limit ?? params?.limit ?? (rows.length || 1));
    const messages: WhatsAppMessage[] = rows
      .map((message): WhatsAppMessage => ({
        id: String(message.id ?? ''),
        to: String(message.recipient ?? ''),
        from: '',
        message_type: message.message_type === 'purchase_order' ? 'DOCUMENT' : message.message_type === 'campaign' ? 'TEMPLATE' : 'TEXT',
        content: message.content ?? (message.message_type === 'purchase_order' ? 'Purchase order message' : 'Alert message'),
        template_name: message.template_name,
        status: mapMessageStatus(message.status),
        sent_at: message.sent_at ?? nowIso(),
        created_at: message.sent_at ?? nowIso(),
      }))
      .filter((message) => {
        if (params?.to && !message.to.includes(params.to)) {
          return false;
        }
        if (params?.status && message.status !== params.status) {
          return false;
        }
        return true;
      });

    return {
      messages,
      total: Number(meta.total ?? messages.length),
      page,
      pages: limit > 0 ? Math.max(1, Math.ceil(Number(meta.total ?? messages.length) / limit)) : 1,
    };
  },

  getMessage: async (id: string): Promise<WhatsAppMessage> => {
    const response = await whatsappApi.getMessages();
    const message = response.messages.find((entry) => entry.id === id);
    if (!message) {
      throw new Error('WhatsApp message not found.');
    }
    return message;
  },

  getCampaigns: async (): Promise<WhatsAppCampaign[]> => {
    const response = await request<Array<{
      id?: string;
      name?: string;
      description?: string;
      template_id?: string;
      template_name?: string;
      recipient_count?: number;
      sent_count?: number;
      delivered_count?: number;
      read_count?: number;
      status?: string;
      scheduled_at?: string;
      sent_at?: string;
      completed_at?: string;
      created_at?: string;
      updated_at?: string;
    }>>({
      url: `${WHATSAPP_BASE}/campaigns`,
      method: 'GET',
    });
    return Array.isArray(response)
      ? response.map((campaign) => ({
          id: String(campaign.id ?? ''),
          name: campaign.name ?? 'Campaign',
          description: campaign.description ?? '',
          template_id: String(campaign.template_id ?? ''),
          template_name: campaign.template_name ?? '',
          recipient_count: Number(campaign.recipient_count ?? 0),
          sent_count: Number(campaign.sent_count ?? 0),
          delivered_count: Number(campaign.delivered_count ?? 0),
          read_count: Number(campaign.read_count ?? 0),
          status: mapCampaignStatus(campaign.status),
          scheduled_at: campaign.scheduled_at ?? undefined,
          sent_at: campaign.sent_at ?? undefined,
          completed_at: campaign.completed_at ?? undefined,
          created_by: 'current_user',
          created_at: campaign.created_at ?? nowIso(),
          updated_at: campaign.updated_at ?? nowIso(),
        }))
      : [];
  },

  createCampaign: async (data: {
    name: string;
    description: string;
    template_id: string;
    recipients: string[];
    scheduled_at?: string;
  }): Promise<WhatsAppCampaign> => {
    const response = await request<{
      id?: string;
      name?: string;
      description?: string;
      template_id?: string;
      template_name?: string;
      recipient_count?: number;
      sent_count?: number;
      delivered_count?: number;
      read_count?: number;
      status?: string;
      scheduled_at?: string;
      sent_at?: string;
      completed_at?: string;
      created_at?: string;
      updated_at?: string;
    }>({
      url: `${WHATSAPP_BASE}/campaigns`,
      method: 'POST',
      data,
    });
    return {
      id: String(response.id ?? ''),
      name: response.name ?? data.name,
      description: response.description ?? data.description,
      template_id: String(response.template_id ?? data.template_id),
      template_name: response.template_name ?? '',
      recipient_count: Number(response.recipient_count ?? data.recipients.length),
      sent_count: Number(response.sent_count ?? 0),
      delivered_count: Number(response.delivered_count ?? 0),
      read_count: Number(response.read_count ?? 0),
      status: mapCampaignStatus(response.status),
      scheduled_at: response.scheduled_at ?? data.scheduled_at,
      sent_at: response.sent_at ?? undefined,
      completed_at: response.completed_at ?? undefined,
      created_by: 'current_user',
      created_at: response.created_at ?? nowIso(),
      updated_at: response.updated_at ?? nowIso(),
    };
  },

  getCampaign: async (id: string): Promise<WhatsAppCampaign> => {
    const response = await request<{
      id?: string;
      name?: string;
      description?: string;
      template_id?: string;
      template_name?: string;
      recipient_count?: number;
      sent_count?: number;
      delivered_count?: number;
      read_count?: number;
      status?: string;
      scheduled_at?: string;
      sent_at?: string;
      completed_at?: string;
      created_at?: string;
      updated_at?: string;
    }>({
      url: `${WHATSAPP_BASE}/campaigns/${id}`,
      method: 'GET',
    });
    return {
      id: String(response.id ?? id),
      name: response.name ?? 'Campaign',
      description: response.description ?? '',
      template_id: String(response.template_id ?? ''),
      template_name: response.template_name ?? '',
      recipient_count: Number(response.recipient_count ?? 0),
      sent_count: Number(response.sent_count ?? 0),
      delivered_count: Number(response.delivered_count ?? 0),
      read_count: Number(response.read_count ?? 0),
      status: mapCampaignStatus(response.status),
      scheduled_at: response.scheduled_at ?? undefined,
      sent_at: response.sent_at ?? undefined,
      completed_at: response.completed_at ?? undefined,
      created_by: 'current_user',
      created_at: response.created_at ?? nowIso(),
      updated_at: response.updated_at ?? nowIso(),
    };
  },

  updateCampaign: async (id: string, data: Partial<WhatsAppCampaign>): Promise<WhatsAppCampaign> => {
    await request<unknown>({
      url: `${WHATSAPP_BASE}/campaigns/${id}`,
      method: 'PATCH',
      data,
    });
    return whatsappApi.getCampaign(id);
  },

  deleteCampaign: async (id: string): Promise<void> => {
    await request<{ id: string; deleted: boolean }>({
      url: `${WHATSAPP_BASE}/campaigns/${id}`,
      method: 'DELETE',
    });
  },

  sendCampaign: async (id: string): Promise<void> => {
    await request<{ id: string; sent_count: number; status: string }>({
      url: `${WHATSAPP_BASE}/campaigns/${id}/send`,
      method: 'POST',
    });
  },

  getAnalytics: async (_params?: { from_date?: string; to_date?: string }): Promise<WhatsAppAnalytics> => {
    const { messages } = await whatsappApi.getMessages();
    const delivered = messages.filter((message) => ['DELIVERED', 'READ'].includes(message.status)).length;
    const read = messages.filter((message) => message.status === 'READ').length;
    const failed = messages.filter((message) => message.status === 'FAILED').length;
    const sent = messages.filter((message) => ['SENT', 'DELIVERED', 'READ'].includes(message.status)).length;

    const stats = new Map<string, { sent: number; delivered: number; read: number }>();
    for (const message of messages) {
      const key = toDateKey(message.sent_at);
      const entry = stats.get(key) ?? { sent: 0, delivered: 0, read: 0 };
      if (['SENT', 'DELIVERED', 'READ'].includes(message.status)) {
        entry.sent += 1;
      }
      if (['DELIVERED', 'READ'].includes(message.status)) {
        entry.delivered += 1;
      }
      if (message.status === 'READ') {
        entry.read += 1;
      }
      stats.set(key, entry);
    }

    return {
      total_messages: messages.length,
      sent_messages: sent,
      delivered_messages: delivered,
      read_messages: read,
      failed_messages: failed,
      delivery_rate: messages.length ? delivered / messages.length : 0,
      read_rate: delivered ? read / delivered : 0,
      top_templates: [],
      daily_stats: [...stats.entries()].map(([date, value]) => ({
        date,
        sent: value.sent,
        delivered: value.delivered,
        read: value.read,
      })),
    };
  },

  optInCustomer: async (phone: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>({
      url: `${WHATSAPP_BASE}/contacts/${phone}/opt-in`,
      method: 'POST',
    }),

  optOutCustomer: async (phone: string): Promise<{ success: boolean; message: string }> =>
    request<{ success: boolean; message: string }>({
      url: `${WHATSAPP_BASE}/contacts/${phone}/opt-out`,
      method: 'POST',
    }),

  getOptStatus: async (phone: string): Promise<{ status: 'OPTED_IN' | 'OPTED_OUT'; opted_in_at?: string; opted_out_at?: string }> =>
    request<{ status: 'OPTED_IN' | 'OPTED_OUT'; opted_in_at?: string; opted_out_at?: string }>({
      url: `${WHATSAPP_BASE}/contacts/${phone}/status`,
      method: 'GET',
    }),

  sendTestMessage: async (data: {
    to: string;
    template_name: string;
    template_language: string;
    template_variables?: Record<string, string>;
  }): Promise<WhatsAppMessage> => {
    const response = await request<{
      id?: string | number;
      message_type?: string;
      recipient?: string;
      status?: string;
      sent_at?: string;
      template_name?: string;
    }>({
      url: `${WHATSAPP_BASE}/messages/test`,
      method: 'POST',
      data,
    });
    return {
      id: String(response.id ?? ''),
      to: String(response.recipient ?? data.to),
      from: '',
      message_type: 'TEMPLATE',
      content: `Test template ${data.template_name}`,
      template_name: response.template_name ?? data.template_name,
      template_language: data.template_language,
      template_variables: data.template_variables,
      status: mapMessageStatus(response.status),
      sent_at: response.sent_at ?? nowIso(),
      created_at: response.sent_at ?? nowIso(),
    };
  },
};
