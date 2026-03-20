/**
 * src/api/suppliers.ts
 * Oracle Document sections consumed: 3.2, 5.2
 * Last item from Section 11 risks addressed here: Store scoping, soft delete
 */
import { apiClient } from './client';

// Supplier types based on Oracle Section 4.1
export interface Supplier {
  supplier_id: string;
  store_id: string;
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  payment_terms?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  contact: string;
  email?: string;
  phone?: string;
  address?: string;
  gst_number?: string;
  payment_terms?: string;
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

// ⚠️ RISK [MEDIUM]: Supplier operations must maintain store scoping
export const suppliersApi = {
  // List suppliers with filters
  // Oracle: GET /api/v1/suppliers
  listSuppliers: async (params: ListSuppliersRequest = {}): Promise<SupplierListResponse> => {
    const response = await apiClient.get('/suppliers', { params });
    return response.data;
  },

  // Get supplier by ID
  // Oracle: GET /api/v1/suppliers/<id>
  getSupplier: async (supplierId: string): Promise<Supplier> => {
    const response = await apiClient.get(`/suppliers/${supplierId}`);
    return response.data;
  },

  // Create new supplier
  // Oracle: POST /api/v1/suppliers
  createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
    const response = await apiClient.post('/suppliers', data);
    return response.data;
  },

  // Update supplier
  // Oracle: PUT /api/v1/suppliers/<id>
  updateSupplier: async (supplierId: string, data: UpdateSupplierRequest): Promise<Supplier> => {
    const response = await apiClient.put(`/suppliers/${supplierId}`, data);
    return response.data;
  },

  // Delete supplier (soft delete)
  // Oracle: DELETE /api/v1/suppliers/<id>
  deleteSupplier: async (supplierId: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${supplierId}`);
  },

  // Get supplier products
  // Oracle: GET /api/v1/suppliers/<id>/products
  getSupplierProducts: async (supplierId: string): Promise<SupplierProduct[]> => {
    const response = await apiClient.get(`/suppliers/${supplierId}/products`);
    return response.data.products || [];
  },

  // Link product to supplier
  // Oracle: POST /api/v1/suppliers/<id>/products
  linkProduct: async (supplierId: string, data: Omit<SupplierProduct, 'supplier_product_id' | 'supplier_id'>): Promise<SupplierProduct> => {
    const response = await apiClient.post(`/suppliers/${supplierId}/products`, data);
    return response.data;
  },

  // Update supplier product link
  // Oracle: PUT /api/v1/suppliers/<id>/products/<productId>
  updateProductLink: async (supplierId: string, productId: string, data: Partial<SupplierProduct>): Promise<SupplierProduct> => {
    const response = await apiClient.put(`/suppliers/${supplierId}/products/${productId}`, data);
    return response.data;
  },

  // Remove product link
  // Oracle: DELETE /api/v1/suppliers/<id>/products/<productId>
  removeProductLink: async (supplierId: string, productId: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${supplierId}/products/${productId}`);
  },

  // Get supplier analytics
  // Oracle: GET /api/v1/suppliers/<id>/analytics
  getSupplierAnalytics: async (supplierId: string): Promise<{
    total_orders: number;
    total_value: number;
    avg_order_value: number;
    last_order_date?: string;
    product_count: number;
  }> => {
    const response = await apiClient.get(`/suppliers/${supplierId}/analytics`);
    return response.data;
  },
};
