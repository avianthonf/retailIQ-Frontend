/**
 * src/api/whatsapp.ts
 * WhatsApp Integration API
 */
import { apiClient } from './client';

// WhatsApp types
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

// WhatsApp API
export const whatsappApi = {
  // Configuration
  getConfig: async (): Promise<WhatsAppConfig> => {
    const response = await apiClient.get('/whatsapp/config');
    return response.data;
  },

  updateConfig: async (data: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> => {
    const response = await apiClient.put('/whatsapp/config', data);
    return response.data;
  },

  // Webhook
  verifyWebhook: async (mode: string, token: string, challenge: string): Promise<string> => {
    const response = await apiClient.get('/whatsapp/webhook', {
      params: { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge }
    });
    return response.data;
  },

  // Templates
  getTemplates: async (): Promise<WhatsAppTemplate[]> => {
    const response = await apiClient.get('/whatsapp/templates');
    return response.data;
  },

  createTemplate: async (data: {
    name: string;
    category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
    language: string;
    components: WhatsAppTemplate['components'];
  }): Promise<WhatsAppTemplate> => {
    const response = await apiClient.post('/whatsapp/templates', data);
    return response.data;
  },

  // Messages
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
    const response = await apiClient.post('/whatsapp/messages', data);
    return response.data;
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
    const response = await apiClient.post('/whatsapp/messages/bulk', { messages });
    return response.data;
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
    const response = await apiClient.get('/whatsapp/messages', { params });
    return response.data;
  },

  getMessage: async (id: string): Promise<WhatsAppMessage> => {
    const response = await apiClient.get(`/whatsapp/messages/${id}`);
    return response.data;
  },

  // Campaigns
  getCampaigns: async (): Promise<WhatsAppCampaign[]> => {
    const response = await apiClient.get('/whatsapp/campaigns');
    return response.data;
  },

  createCampaign: async (data: {
    name: string;
    description: string;
    template_id: string;
    recipients: string[];
    scheduled_at?: string;
  }): Promise<WhatsAppCampaign> => {
    const response = await apiClient.post('/whatsapp/campaigns', data);
    return response.data;
  },

  getCampaign: async (id: string): Promise<WhatsAppCampaign> => {
    const response = await apiClient.get(`/whatsapp/campaigns/${id}`);
    return response.data;
  },

  updateCampaign: async (id: string, data: Partial<WhatsAppCampaign>): Promise<WhatsAppCampaign> => {
    const response = await apiClient.put(`/whatsapp/campaigns/${id}`, data);
    return response.data;
  },

  deleteCampaign: async (id: string): Promise<void> => {
    await apiClient.delete(`/whatsapp/campaigns/${id}`);
  },

  sendCampaign: async (id: string): Promise<void> => {
    await apiClient.post(`/whatsapp/campaigns/${id}/send`);
  },

  // Analytics
  getAnalytics: async (params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<WhatsAppAnalytics> => {
    const response = await apiClient.get('/whatsapp/analytics', { params });
    return response.data;
  },

  // Customer Opt-in/Out
  optInCustomer: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/whatsapp/opt-in', { phone });
    return response.data;
  },

  optOutCustomer: async (phone: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/whatsapp/opt-out', { phone });
    return response.data;
  },

  getOptStatus: async (phone: string): Promise<{ status: 'OPTED_IN' | 'OPTED_OUT'; opted_in_at?: string; opted_out_at?: string }> => {
    const response = await apiClient.get(`/whatsapp/opt-status/${phone}`);
    return response.data;
  },

  // Test Mode
  sendTestMessage: async (data: {
    to: string;
    template_name: string;
    template_language: string;
    template_variables?: Record<string, string>;
  }): Promise<WhatsAppMessage> => {
    const response = await apiClient.post('/whatsapp/test', data);
    return response.data;
  },
};
