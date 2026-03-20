/**
 * src/api/vision.ts
 * Oracle Document sections consumed: 3, 4, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { postForm, request } from '@/api/client';
import type {
  ConfirmOcrItemsRequest,
  ConfirmOcrItemsResponse,
  DismissOcrJobResponse,
  GetOcrJobResponse,
  ReceiptDigitizationRequest,
  ReceiptDigitizationResponse,
  ShelfScanRequest,
  ShelfScanResponse,
  UploadOcrRequest,
  UploadOcrResponse,
} from '@/types/api';

const createFormData = (key: string, file: File) => {
  const formData = new FormData();
  formData.append(key, file);
  return formData;
};

export const uploadOcrInvoice = ({ invoice_image }: UploadOcrRequest) => postForm<UploadOcrResponse>('/api/v1/vision/ocr/upload', createFormData('invoice_image', invoice_image));
export const getOcrJob = (jobId: string | number) => request<GetOcrJobResponse>({ url: `/api/v1/vision/ocr/${jobId}`, method: 'GET' });
export const confirmOcrJob = (jobId: string | number, payload: ConfirmOcrItemsRequest) => request<ConfirmOcrItemsResponse>({ url: `/api/v1/vision/ocr/${jobId}/confirm`, method: 'POST', data: payload });
export const dismissOcrJob = (jobId: string | number) => request<DismissOcrJobResponse>({ url: `/api/v1/vision/ocr/${jobId}/dismiss`, method: 'POST' });
export const shelfScan = (payload: ShelfScanRequest) => request<ShelfScanResponse>({ url: '/api/v1/vision/shelf-scan', method: 'POST', data: payload });
export const digitizeReceipt = ({ receipt_image }: ReceiptDigitizationRequest) => postForm<ReceiptDigitizationResponse>('/api/v1/vision/receipt', createFormData('receipt_image', receipt_image));
