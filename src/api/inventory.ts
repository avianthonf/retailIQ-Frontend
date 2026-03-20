/**
 * src/api/inventory.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request } from '@/api/client';
import type {
  CreateProductRequest,
  CreateProductResponse,
  DeleteProductResponse,
  GetProductResponse,
  ListProductsRequest,
  ListProductsResponse,
  StockAuditRequest,
  StockAuditResponse,
  StockUpdateRequest,
  StockUpdateResponse,
  UpdateProductRequest,
  UpdateProductResponse,
} from '@/types/api';

export const listProducts = (filters: ListProductsRequest) => request<ListProductsResponse>({ url: '/api/v1/inventory', method: 'GET', params: filters });
export const getProductById = (productId: number | string) => request<GetProductResponse>({ url: `/api/v1/inventory/${productId}`, method: 'GET' });
export const createProduct = (payload: CreateProductRequest) => request<CreateProductResponse>({ url: '/api/v1/inventory', method: 'POST', data: payload });
export const updateProduct = (productId: number | string, payload: UpdateProductRequest) => request<UpdateProductResponse>({ url: `/api/v1/inventory/${productId}`, method: 'PUT', data: payload });
export const deleteProduct = (productId: number | string) => request<DeleteProductResponse>({ url: `/api/v1/inventory/${productId}`, method: 'DELETE' });
export const addStock = (productId: number | string, payload: StockUpdateRequest) => request<StockUpdateResponse>({ url: `/api/v1/inventory/${productId}/stock`, method: 'POST', data: payload });
export const updateStock = (productId: number | string, payload: StockUpdateRequest) => request<StockUpdateResponse>({ url: `/api/v1/inventory/${productId}/stock-update`, method: 'POST', data: payload });
export const stockAudit = (payload: StockAuditRequest) => request<StockAuditResponse>({ url: '/api/v1/inventory/stock-audit', method: 'POST', data: payload });
export const stockAuditLegacy = (payload: StockAuditRequest) => request<StockAuditResponse>({ url: '/api/v1/inventory/audit', method: 'POST', data: payload });
export const getPriceHistory = (productId: number | string) => request<{ product_id: number | string; history: unknown[] }>({ url: `/api/v1/inventory/${productId}/price-history`, method: 'GET' });
