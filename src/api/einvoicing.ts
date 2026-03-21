import { request } from '@/api/client';
import type {
  GenerateEInvoiceRequest,
  GenerateEInvoiceResponse,
  GetEInvoiceStatusResponse,
} from '@/types/api';

const BASE = '/api/v2/einvoice';

export const generateEInvoice = (data: GenerateEInvoiceRequest) =>
  request<GenerateEInvoiceResponse>({ url: `${BASE}/generate`, method: 'POST', data });

export const getEInvoiceStatus = (invoiceId: string) =>
  request<GetEInvoiceStatusResponse>({ url: `${BASE}/status/${invoiceId}`, method: 'GET' });
