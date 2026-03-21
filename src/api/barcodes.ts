import { request, requestEnvelope } from '@/api/client';

export interface BarcodeRecord {
  id: number;
  barcode_value: string;
  barcode_type: string;
  created_at: string | null;
}

export interface RegisterBarcodeRequest {
  product_id: number | string;
  barcode_value: string;
  barcode_type?: string;
}

export interface RegisterBarcodeResponse extends BarcodeRecord {
  product_id: number | string;
  store_id: number | string;
}

export const registerBarcode = (data: RegisterBarcodeRequest) =>
  request<RegisterBarcodeResponse>({ url: '/api/v1/barcodes/register', method: 'POST', data });

export async function listBarcodes(productId: number | string) {
  const envelope = await requestEnvelope<BarcodeRecord[]>({
    url: '/api/v1/barcodes/list',
    method: 'GET',
    params: { product_id: productId },
  });
  return Array.isArray(envelope.data) ? envelope.data : [];
}
