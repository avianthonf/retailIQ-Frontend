/**
 * src/api/receipts.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { request, requestBlob } from '@/api/client';
import type {
  GetPrintJobResponse,
  GetReceiptTemplateResponse,
  LookupBarcodeRequest,
  LookupBarcodeResponse,
  PrintReceiptRequest,
  PrintReceiptResponse,
  UpdateReceiptTemplateRequest,
  UpdateReceiptTemplateResponse,
} from '@/types/api';

export const getReceiptTemplate = () => request<GetReceiptTemplateResponse>({ url: '/api/v1/receipts/template', method: 'GET' });
export const updateReceiptTemplate = (payload: UpdateReceiptTemplateRequest) => request<UpdateReceiptTemplateResponse>({ url: '/api/v1/receipts/template', method: 'PUT', data: payload });
export const printReceipt = (payload: PrintReceiptRequest) => request<PrintReceiptResponse>({ url: '/api/v1/receipts/print', method: 'POST', data: payload });
export const getPrintJob = (jobId: string | number) => request<GetPrintJobResponse>({ url: `/api/v1/receipts/print/${jobId}`, method: 'GET' });
export const lookupBarcode = async (payload: LookupBarcodeRequest): Promise<LookupBarcodeResponse> => {
  const data = await request<Record<string, unknown>>({ url: '/api/v1/barcodes/lookup', method: 'GET', params: payload });
  return {
    barcode_value: String(data.barcode_value ?? payload.value),
    barcode_type: String(data.barcode_type ?? 'EAN13'),
    product_id: typeof data.product_id === 'number' ? data.product_id : 0,
    product_name: typeof data.product_name === 'string' ? data.product_name : '',
    current_stock: typeof data.current_stock === 'number' ? data.current_stock : 0,
    price: typeof data.price === 'number' ? data.price : 0,
  };
};
export const getReceiptTemplateBlob = () => requestBlob({ url: '/api/v1/receipts/template', method: 'GET' });
