/**
 * src/api/purchaseOrders.ts
 * Oracle Document sections consumed: 3.2, 5.2
 * Last item from Section 11 risks addressed here: Store scoping, PO status tracking
 */
import { apiClient } from './client';

// Purchase Order types based on Oracle Section 4.1
export interface PurchaseOrder {
  purchase_order_id: string;
  store_id: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery_date?: string;
  received_date?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  notes?: string;
  internal_notes?: string;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  line_items: PurchaseOrderLineItem[];
}

export interface PurchaseOrderLineItem {
  line_item_id: string;
  product_id: string;
  sku_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total_amount: number;
  received_quantity: number;
  pending_quantity: number;
  notes?: string;
}

export type PurchaseOrderStatus = 
  | 'DRAFT'
  | 'SENT'
  | 'CONFIRMED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED'
  | 'REJECTED';

export interface CreatePurchaseOrderRequest {
  supplier_id: string;
  expected_delivery_date?: string;
  notes?: string;
  internal_notes?: string;
  line_items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
    discount_rate?: number;
    notes?: string;
  }>;
}

export interface UpdatePurchaseOrderRequest {
  status?: PurchaseOrderStatus;
  expected_delivery_date?: string;
  notes?: string;
  internal_notes?: string;
  line_items?: Array<{
    line_item_id?: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
    discount_rate?: number;
    notes?: string;
  }>;
}

export interface ReceivePurchaseOrderRequest {
  line_items: Array<{
    line_item_id: string;
    received_quantity: number;
    notes?: string;
  }>;
  notes?: string;
}

export interface ListPurchaseOrdersRequest {
  page?: number;
  limit?: number;
  search?: string;
  supplier_id?: string;
  status?: PurchaseOrderStatus | PurchaseOrderStatus[];
  date_from?: string;
  date_to?: string;
  sort_by?: 'order_date' | 'expected_delivery_date' | 'total_amount';
  sort_order?: 'asc' | 'desc';
}

export interface PurchaseOrderListResponse {
  purchase_orders: PurchaseOrder[];
  total: number;
  page: number;
  pages: number;
}

export interface PurchaseOrderSummary {
  total_orders: number;
  draft_count: number;
  sent_count: number;
  confirmed_count: number;
  received_count: number;
  cancelled_count: number;
  total_value: number;
  pending_value: number;
}

// ⚠️ RISK [MEDIUM]: Purchase orders must maintain store scoping
export const purchaseOrdersApi = {
  // List purchase orders with filters
  // Oracle: GET /api/v1/purchase-orders
  listPurchaseOrders: async (params: ListPurchaseOrdersRequest = {}): Promise<PurchaseOrderListResponse> => {
    const response = await apiClient.get('/purchase-orders', { params });
    return response.data;
  },

  // Get purchase order by ID
  // Oracle: GET /api/v1/purchase-orders/<id>
  getPurchaseOrder: async (purchaseOrderId: string): Promise<PurchaseOrder> => {
    const response = await apiClient.get(`/purchase-orders/${purchaseOrderId}`);
    return response.data;
  },

  // Create new purchase order
  // Oracle: POST /api/v1/purchase-orders
  createPurchaseOrder: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.post('/purchase-orders', data);
    return response.data;
  },

  // Update purchase order
  // Oracle: PUT /api/v1/purchase-orders/<id>
  updatePurchaseOrder: async (purchaseOrderId: string, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.put(`/purchase-orders/${purchaseOrderId}`, data);
    return response.data;
  },

  // Delete purchase order (draft only)
  // Oracle: DELETE /api/v1/purchase-orders/<id>
  deletePurchaseOrder: async (purchaseOrderId: string): Promise<void> => {
    await apiClient.delete(`/purchase-orders/${purchaseOrderId}`);
  },

  // Send purchase order to supplier
  // Oracle: POST /api/v1/purchase-orders/<id>/send
  sendPurchaseOrder: async (purchaseOrderId: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post(`/purchase-orders/${purchaseOrderId}/send`);
    return response.data;
  },

  // Confirm purchase order
  // Oracle: POST /api/v1/purchase-orders/<id>/confirm
  confirmPurchaseOrder: async (purchaseOrderId: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post(`/purchase-orders/${purchaseOrderId}/confirm`);
    return response.data;
  },

  // Receive purchase order (partial or full)
  // Oracle: POST /api/v1/purchase-orders/<id>/receive
  receivePurchaseOrder: async (purchaseOrderId: string, data: ReceivePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.post(`/purchase-orders/${purchaseOrderId}/receive`, data);
    return response.data;
  },

  // Cancel purchase order
  // Oracle: POST /api/v1/purchase-orders/<id>/cancel
  cancelPurchaseOrder: async (purchaseOrderId: string, reason?: string): Promise<PurchaseOrder> => {
    const response = await apiClient.post(`/purchase-orders/${purchaseOrderId}/cancel`, { reason });
    return response.data;
  },

  // Get purchase order summary
  // Oracle: GET /api/v1/purchase-orders/summary
  getPurchaseOrderSummary: async (): Promise<PurchaseOrderSummary> => {
    const response = await apiClient.get('/purchase-orders/summary');
    return response.data;
  },

  // Generate PDF for purchase order
  // Oracle: GET /api/v1/purchase-orders/<id>/pdf
  generatePdf: async (purchaseOrderId: string): Promise<{ url: string; job_id: string }> => {
    const response = await apiClient.get(`/purchase-orders/${purchaseOrderId}/pdf`);
    return response.data;
  },

  // Email purchase order to supplier
  // Oracle: POST /api/v1/purchase-orders/<id>/email
  emailPurchaseOrder: async (purchaseOrderId: string, email: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/purchase-orders/${purchaseOrderId}/email`, { email });
    return response.data;
  },
};
