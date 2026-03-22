/**
 * src/api/suppliers.ts
 * Backend-aligned supplier adapters
 */
import { request } from './client';

const SUPPLIERS_BASE = '/api/v1/suppliers';

export interface Supplier {
  supplier_id: string;
  store_id: string;
  name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  analytics?: {
    total_orders: number;
    total_value: number;
    last_order_date?: string;
  };
}

export interface SupplierProduct {
  supplier_product_id: string;
  supplier_id: string;
  product_id: string;
  sku_code: string;
  supplier_sku?: string;
  cost_price: number;
  min_order_quantity: number;
  lead_time_days: number;
  is_active: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  is_active?: boolean;
}

export interface ListSuppliersRequest {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface SupplierListResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  pages: number;
}

interface RawSupplierListItem {
  id?: string;
  name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  payment_terms_days?: number;
  avg_lead_time_days?: number | null;
  fill_rate_90d?: number;
  price_change_6m_pct?: number | null;
}

interface RawSupplierDetail {
  id?: string;
  name?: string;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  payment_terms_days?: number;
  is_active?: boolean;
  analytics?: {
    avg_lead_time_days?: number;
    fill_rate_90d?: number;
  };
  sourced_products?: Array<{
    product_id?: string;
    name?: string;
    quoted_price?: number;
    lead_time_days?: number;
  }>;
  recent_purchase_orders?: Array<{
    id?: string;
    created_at?: string;
  }>;
}

const nowIso = () => new Date().toISOString();

const mapListSupplier = (supplier: RawSupplierListItem): Supplier => ({
  supplier_id: String(supplier.id ?? ''),
  store_id: '',
  name: supplier.name ?? '',
  contact_person: supplier.contact_name ?? '',
  email: supplier.email ?? undefined,
  phone: supplier.phone ?? undefined,
  address: undefined,
  gst_number: undefined,
  is_active: true,
  created_at: nowIso(),
  updated_at: nowIso(),
  analytics: {
    total_orders: 0,
    total_value: 0,
  },
});

const mapDetailSupplier = (supplier: RawSupplierDetail): Supplier => ({
  supplier_id: String(supplier.id ?? ''),
  store_id: '',
  name: supplier.name ?? '',
  contact_person: supplier.contact?.name ?? '',
  email: supplier.contact?.email ?? undefined,
  phone: supplier.contact?.phone ?? undefined,
  address: supplier.contact?.address ?? undefined,
  gst_number: undefined,
  is_active: supplier.is_active ?? true,
  created_at: nowIso(),
  updated_at: nowIso(),
  analytics: {
    total_orders: supplier.recent_purchase_orders?.length ?? 0,
    total_value: 0,
    last_order_date: supplier.recent_purchase_orders?.[0]?.created_at,
  },
});


export const suppliersApi = {
  listSuppliers: async (params: ListSuppliersRequest = {}): Promise<SupplierListResponse> => {
    if (params.is_active === false) {
      return { suppliers: [], total: 0, page: params.page ?? 1, pages: 0 };
    }

    const response = await request<RawSupplierListItem[]>({ url: SUPPLIERS_BASE, method: 'GET' });
    const allSuppliers = Array.isArray(response) ? response.map(mapListSupplier) : [];
    const filtered = allSuppliers.filter((supplier) => {
      if (!params.search) {
        return true;
      }
      const query = params.search.toLowerCase();
      return supplier.name.toLowerCase().includes(query) || supplier.contact_person.toLowerCase().includes(query);
    });

    const page = params.page ?? 1;
    const pageSize = params.page_size ?? (filtered.length || 1);
    const start = (page - 1) * pageSize;
    const suppliers = filtered.slice(start, start + pageSize);

    return {
      suppliers,
      total: filtered.length,
      page,
      pages: filtered.length ? Math.ceil(filtered.length / pageSize) : 0,
    };
  },

  getSupplier: async (supplierId: string): Promise<Supplier> => {
    const response = await request<RawSupplierDetail>({ url: `${SUPPLIERS_BASE}/${supplierId}`, method: 'GET' });
    return mapDetailSupplier(response);
  },

  createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
    const response = await request<{ supplier_id?: number | string; id?: string }>({
      url: SUPPLIERS_BASE,
      method: 'POST',
      data: {
        name: data.name,
        contact_name: data.contact_person,
        phone: data.phone,
        email: data.email,
        address: data.address,
        gst_number: data.gst_number,
      },
    });

    return suppliersApi.getSupplier(String(response.supplier_id ?? response.id ?? ''));
  },

  updateSupplier: async (supplierId: string, data: UpdateSupplierRequest): Promise<Supplier> => {
    await request<{ supplier_id?: number | string }>({
      url: `${SUPPLIERS_BASE}/${supplierId}`,
      method: 'PUT',
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.contact_person !== undefined ? { contact_name: data.contact_person } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.gst_number !== undefined ? { gst_number: data.gst_number } : {}),
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
      },
    });

    return suppliersApi.getSupplier(supplierId);
  },

  deleteSupplier: async (supplierId: string): Promise<void> => {
    await request<{ id?: string }>({ url: `${SUPPLIERS_BASE}/${supplierId}`, method: 'DELETE' });
  },

  getSupplierProducts: async (supplierId: string): Promise<SupplierProduct[]> => {
    const supplier = await request<RawSupplierDetail>({ url: `${SUPPLIERS_BASE}/${supplierId}`, method: 'GET' });
    return Array.isArray(supplier.sourced_products)
      ? supplier.sourced_products.map((product) => ({
          supplier_product_id: `${supplierId}:${product.product_id ?? ''}`,
          supplier_id: supplierId,
          product_id: String(product.product_id ?? ''),
          sku_code: product.name ?? String(product.product_id ?? ''),
          supplier_sku: undefined,
          cost_price: Number(product.quoted_price ?? 0),
          min_order_quantity: 1,
          lead_time_days: Number(product.lead_time_days ?? 0),
          is_active: true,
        }))
      : [];
  },

  linkProduct: async (supplierId: string, data: Omit<SupplierProduct, 'supplier_product_id' | 'supplier_id'>): Promise<SupplierProduct> => {
    const response = await request<{ id?: string }>({
      url: `${SUPPLIERS_BASE}/${supplierId}/products`,
      method: 'POST',
      data: {
        product_id: data.product_id,
        quoted_price: data.cost_price,
        lead_time_days: data.lead_time_days,
      },
    });

    return {
      supplier_product_id: String(response.id ?? `${supplierId}:${data.product_id}`),
      supplier_id: supplierId,
      product_id: data.product_id,
      sku_code: data.sku_code,
      supplier_sku: data.supplier_sku,
      cost_price: data.cost_price,
      min_order_quantity: data.min_order_quantity,
      lead_time_days: data.lead_time_days,
      is_active: data.is_active,
    };
  },

  updateProductLink: async (
    supplierId: string,
    productId: string,
    data: Partial<SupplierProduct>,
  ): Promise<SupplierProduct> => {
    await request<{ id?: string }>({
      url: `${SUPPLIERS_BASE}/${supplierId}/products/${productId}`,
      method: 'PATCH',
      data: {
        ...(data.cost_price !== undefined ? { quoted_price: data.cost_price } : {}),
        ...(data.lead_time_days !== undefined ? { lead_time_days: data.lead_time_days } : {}),
        ...(data.is_active !== undefined ? { is_preferred_supplier: data.is_active } : {}),
      },
    });

    const products = await suppliersApi.getSupplierProducts(supplierId);
    const updated = products.find((product) => product.product_id === productId);
    if (!updated) {
      throw new Error('Supplier product link not found after update.');
    }
    return updated;
  },

  removeProductLink: async (supplierId: string, productId: string): Promise<void> => {
    await request<{ product_id: string; deleted: boolean }>({
      url: `${SUPPLIERS_BASE}/${supplierId}/products/${productId}`,
      method: 'DELETE',
    });
  },

  getSupplierAnalytics: async (supplierId: string): Promise<{
    total_orders: number;
    total_value: number;
    avg_order_value: number;
    last_order_date?: string;
    product_count: number;
  }> => {
    const detail = await request<RawSupplierDetail>({ url: `${SUPPLIERS_BASE}/${supplierId}`, method: 'GET' });
    const totalOrders = detail.recent_purchase_orders?.length ?? 0;
    const productCount = detail.sourced_products?.length ?? 0;

    return {
      total_orders: totalOrders,
      total_value: 0,
      avg_order_value: 0,
      last_order_date: detail.recent_purchase_orders?.[0]?.created_at,
      product_count: productCount,
    };
  },
};
