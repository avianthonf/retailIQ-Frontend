/**
 * src/api/purchaseOrders.ts
 * Backend-aligned purchase order adapters
 */
import { request } from './client';

const PURCHASE_ORDERS_BASE = '/api/v1/purchase-orders';

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

interface RawPurchaseOrderListItem {
  id?: string;
  supplier_id?: string;
  status?: string;
  expected_delivery_date?: string | null;
  created_at?: string;
}

interface RawPurchaseOrderDetail {
  id?: string;
  supplier_id?: string;
  status?: string;
  expected_delivery_date?: string | null;
  notes?: string;
  created_at?: string;
  items?: Array<{
    product_id?: string;
    ordered_qty?: number;
    received_qty?: number;
    unit_price?: number;
  }>;
}

const nowIso = () => new Date().toISOString();

const mapStatus = (status?: string, items?: RawPurchaseOrderDetail['items']): PurchaseOrderStatus => {
  if (status === 'FULFILLED') {
    return 'RECEIVED';
  }
  if (status === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (status === 'SENT') {
    const hasPartial = Array.isArray(items) && items.some((item) => Number(item.received_qty ?? 0) > 0);
    return hasPartial ? 'PARTIALLY_RECEIVED' : 'SENT';
  }
  return 'DRAFT';
};

const mapPurchaseOrder = (purchaseOrder: RawPurchaseOrderDetail): PurchaseOrder => {
  const lineItems = Array.isArray(purchaseOrder.items)
    ? purchaseOrder.items.map((item) => {
        const quantity = Number(item.ordered_qty ?? 0);
        const receivedQuantity = Number(item.received_qty ?? 0);
        const unitPrice = Number(item.unit_price ?? 0);
        return {
          line_item_id: String(item.product_id ?? ''),
          product_id: String(item.product_id ?? ''),
          sku_code: String(item.product_id ?? ''),
          product_name: String(item.product_id ?? ''),
          quantity,
          unit_price: unitPrice,
          tax_rate: 0,
          discount_rate: 0,
          total_amount: quantity * unitPrice,
          received_quantity: receivedQuantity,
          pending_quantity: Math.max(quantity - receivedQuantity, 0),
        };
      })
    : [];

  const totalAmount = lineItems.reduce((sum, item) => sum + item.total_amount, 0);
  const status = mapStatus(purchaseOrder.status, purchaseOrder.items);

  return {
    purchase_order_id: String(purchaseOrder.id ?? ''),
    store_id: '',
    supplier_id: String(purchaseOrder.supplier_id ?? ''),
    status,
    order_date: purchaseOrder.created_at ?? nowIso(),
    expected_delivery_date: purchaseOrder.expected_delivery_date ?? undefined,
    received_date: status === 'RECEIVED' ? nowIso() : undefined,
    total_amount: totalAmount,
    tax_amount: 0,
    discount_amount: 0,
    final_amount: totalAmount,
    notes: purchaseOrder.notes ?? undefined,
    internal_notes: undefined,
    created_by: '',
    updated_by: undefined,
    created_at: purchaseOrder.created_at ?? nowIso(),
    updated_at: purchaseOrder.created_at ?? nowIso(),
    line_items: lineItems,
  };
};

const mapBackendStatusFilter = (status?: PurchaseOrderStatus | PurchaseOrderStatus[]) => {
  if (Array.isArray(status)) {
    return status[0] === 'RECEIVED' ? 'FULFILLED' : status[0];
  }
  if (status === 'RECEIVED') {
    return 'FULFILLED';
  }
  if (status === 'PARTIALLY_RECEIVED') {
    return 'SENT';
  }
  return status;
};

export const purchaseOrdersApi = {
  listPurchaseOrders: async (params: ListPurchaseOrdersRequest = {}): Promise<PurchaseOrderListResponse> => {
    const response = await request<RawPurchaseOrderListItem[]>({
      url: PURCHASE_ORDERS_BASE,
      method: 'GET',
      params: {
        status: mapBackendStatusFilter(params.status),
      },
    });

    const detailPromises = Array.isArray(response)
      ? response.map((purchaseOrder) =>
          request<RawPurchaseOrderDetail>({
            url: `${PURCHASE_ORDERS_BASE}/${purchaseOrder.id}`,
            method: 'GET',
          }),
        )
      : [];

    const detailedOrders = (await Promise.all(detailPromises)).map(mapPurchaseOrder);
    let filtered = detailedOrders;

    if (params.supplier_id) {
      filtered = filtered.filter((purchaseOrder) => purchaseOrder.supplier_id === params.supplier_id);
    }

    if (params.search) {
      const query = params.search.toLowerCase();
      filtered = filtered.filter((purchaseOrder) => purchaseOrder.purchase_order_id.toLowerCase().includes(query));
    }

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      filtered = filtered.filter((purchaseOrder) => statuses.includes(purchaseOrder.status));
    }

    if (params.date_from) {
      filtered = filtered.filter((purchaseOrder) => purchaseOrder.order_date >= params.date_from!);
    }

    if (params.date_to) {
      filtered = filtered.filter((purchaseOrder) => purchaseOrder.order_date <= params.date_to!);
    }

    const sortBy = params.sort_by ?? 'order_date';
    const sortOrder = params.sort_order ?? 'desc';
    filtered = [...filtered].sort((left, right) => {
      const leftValue = sortBy === 'total_amount' ? left.final_amount : left[sortBy] ?? '';
      const rightValue = sortBy === 'total_amount' ? right.final_amount : right[sortBy] ?? '';

      if (leftValue < rightValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (leftValue > rightValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    const page = params.page ?? 1;
    const limit = params.limit ?? (filtered.length || 1);
    const start = (page - 1) * limit;

    return {
      purchase_orders: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      pages: filtered.length ? Math.ceil(filtered.length / limit) : 0,
    };
  },

  getPurchaseOrder: async (purchaseOrderId: string): Promise<PurchaseOrder> => {
    const response = await request<RawPurchaseOrderDetail>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}`,
      method: 'GET',
    });
    return mapPurchaseOrder(response);
  },

  createPurchaseOrder: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await request<{ id?: string }>({
      url: PURCHASE_ORDERS_BASE,
      method: 'POST',
      data: {
        supplier_id: data.supplier_id,
        expected_delivery_date: data.expected_delivery_date,
        notes: data.notes,
        items: data.line_items.map((item) => ({
          product_id: item.product_id,
          ordered_qty: item.quantity,
          unit_price: item.unit_price,
        })),
      },
    });

    return purchaseOrdersApi.getPurchaseOrder(String(response.id ?? ''));
  },

  updatePurchaseOrder: async (purchaseOrderId: string, data: UpdatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    await request<RawPurchaseOrderDetail>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}`,
      method: 'PATCH',
      data: {
        expected_delivery_date: data.expected_delivery_date,
        notes: data.notes,
        items: data.line_items?.map((item) => ({
          product_id: item.product_id,
          ordered_qty: item.quantity,
          unit_price: item.unit_price,
        })),
      },
    });

    return purchaseOrdersApi.getPurchaseOrder(purchaseOrderId);
  },

  deletePurchaseOrder: async (purchaseOrderId: string): Promise<void> => {
    await request<{ id?: string }>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/cancel`,
      method: 'PUT',
    });
  },

  sendPurchaseOrder: async (purchaseOrderId: string): Promise<PurchaseOrder> => {
    await request<{ id?: string }>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/send`,
      method: 'POST',
    });
    return purchaseOrdersApi.getPurchaseOrder(purchaseOrderId);
  },

  confirmPurchaseOrder: async (purchaseOrderId: string): Promise<PurchaseOrder> => {
    await request<{ id?: string; status?: string }>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/confirm`,
      method: 'POST',
    });
    return purchaseOrdersApi.getPurchaseOrder(purchaseOrderId);
  },

  receivePurchaseOrder: async (purchaseOrderId: string, data: ReceivePurchaseOrderRequest): Promise<PurchaseOrder> => {
    await request<{ id?: string; status?: string }>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/receive`,
      method: 'POST',
      data: {
        notes: data.notes,
        items: data.line_items.map((item) => ({
          product_id: item.line_item_id,
          received_qty: item.received_quantity,
        })),
      },
    });

    return purchaseOrdersApi.getPurchaseOrder(purchaseOrderId);
  },

  cancelPurchaseOrder: async (purchaseOrderId: string, _reason?: string): Promise<PurchaseOrder> => {
    await request<{ id?: string }>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/cancel`,
      method: 'PUT',
    });
    return purchaseOrdersApi.getPurchaseOrder(purchaseOrderId);
  },

  getPurchaseOrderSummary: async (): Promise<PurchaseOrderSummary> => {
    const response = await purchaseOrdersApi.listPurchaseOrders();
    const purchaseOrders = response.purchase_orders;

    return {
      total_orders: purchaseOrders.length,
      draft_count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.status === 'DRAFT').length,
      sent_count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.status === 'SENT').length,
      confirmed_count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.status === 'CONFIRMED').length,
      received_count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.status === 'RECEIVED').length,
      cancelled_count: purchaseOrders.filter((purchaseOrder) => purchaseOrder.status === 'CANCELLED').length,
      total_value: purchaseOrders.reduce((sum, purchaseOrder) => sum + purchaseOrder.final_amount, 0),
      pending_value: purchaseOrders
        .filter((purchaseOrder) => !['RECEIVED', 'CANCELLED', 'REJECTED'].includes(purchaseOrder.status))
        .reduce((sum, purchaseOrder) => sum + purchaseOrder.final_amount, 0),
    };
  },

  generatePdf: async (purchaseOrderId: string): Promise<{ url: string; job_id: string }> =>
    request<{ url: string; job_id: string }>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/pdf`,
      method: 'GET',
    }),

  emailPurchaseOrder: async (purchaseOrderId: string, email: string): Promise<{ message: string }> =>
    request<{ message: string }>({
      url: `${PURCHASE_ORDERS_BASE}/${purchaseOrderId}/email`,
      method: 'POST',
      data: { email },
    }),
};
