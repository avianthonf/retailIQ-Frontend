/**
 * src/api/whatsapp.ts
 * Backend-aligned WhatsApp adapters
 */
import { request, unsupportedApi } from './client';

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
    const response = await request<Array<{ id?: string | number; name?: string; category?: string; language?: string; status?: string }>>({
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
          components: [],
          created_at: nowIso(),
          updated_at: nowIso(),
        }))
      : [];
  },

  createTemplate: async (_data: {
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: WhatsAppTemplate['components'];
  }): Promise<WhatsAppTemplate> => unsupportedApi('Creating WhatsApp templates'),

  sendMessage: async (_data: {
    to: string;
    message_type: 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT';
    content: string;
    template_name?: string;
    template_language?: string;
    template_variables?: Record<string, string>;
    media_url?: string;
    media_filename?: string;
  }): Promise<WhatsAppMessage> => unsupportedApi('Sending arbitrary WhatsApp messages'),

  sendBulkMessages: async (_messages: Array<{
    to: string;
    message_type: 'TEXT' | 'TEMPLATE';
    content: string;
    template_name?: string;
    template_language?: string;
    template_variables?: Record<string, string>;
  }>): Promise<{
    successful: WhatsAppMessage[];
    failed: { to: string; error: string }[];
  }> => unsupportedApi('Bulk WhatsApp messaging'),

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
    const response = await request<Array<{ id?: string | number; message_type?: string; recipient?: string; status?: string; sent_at?: string }>>({
      url: `${WHATSAPP_BASE}/message-log`,
      method: 'GET',
      params,
    });

    const messages: WhatsAppMessage[] = Array.isArray(response)
      ? response
          .map((message): WhatsAppMessage => ({
            id: String(message.id ?? ''),
            to: String(message.recipient ?? ''),
            from: '',
            message_type: message.message_type === 'purchase_order' ? 'DOCUMENT' : 'TEXT',
            content: message.message_type === 'purchase_order' ? 'Purchase order message' : 'Alert message',
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
          })
      : [];

    return {
      messages,
      total: messages.length,
      page: params?.page ?? 1,
      pages: messages.length ? 1 : 0,
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

  getCampaigns: async (): Promise<WhatsAppCampaign[]> => [],

  createCampaign: async (_data: {
    name: string;
    description: string;
    template_id: string;
    recipients: string[];
    scheduled_at?: string;
  }): Promise<WhatsAppCampaign> => unsupportedApi('WhatsApp campaigns'),

  getCampaign: async (_id: string): Promise<WhatsAppCampaign> => unsupportedApi('WhatsApp campaigns'),

  updateCampaign: async (_id: string, _data: Partial<WhatsAppCampaign>): Promise<WhatsAppCampaign> =>
    unsupportedApi('WhatsApp campaigns'),

  deleteCampaign: async (_id: string): Promise<void> => unsupportedApi('WhatsApp campaigns'),

  sendCampaign: async (_id: string): Promise<void> => unsupportedApi('WhatsApp campaigns'),

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

  optInCustomer: async (_phone: string): Promise<{ success: boolean; message: string }> =>
    unsupportedApi('WhatsApp opt-in management'),

  optOutCustomer: async (_phone: string): Promise<{ success: boolean; message: string }> =>
    unsupportedApi('WhatsApp opt-in management'),

  getOptStatus: async (_phone: string): Promise<{ status: 'OPTED_IN' | 'OPTED_OUT'; opted_in_at?: string; opted_out_at?: string }> =>
    unsupportedApi('WhatsApp opt-in management'),

  sendTestMessage: async (_data: {
    to: string;
    template_name: string;
    template_language: string;
    template_variables?: Record<string, string>;
  }): Promise<WhatsAppMessage> => unsupportedApi('Sending WhatsApp test messages'),
};
