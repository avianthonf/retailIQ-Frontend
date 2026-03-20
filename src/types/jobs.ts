/**
 * src/types/jobs.ts
 * Oracle Document sections consumed: 3.2, 5.12
 * Last item from Section 11 risks addressed here: Job status consistency
 */

// Base job interface
export interface BaseJob {
  id: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_message?: string;
  progress?: number; // 0-100
}

// Job status enumeration
export type JobStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'RETRYING';

// OCR-specific job
export interface OcrJob extends BaseJob {
  type: 'ocr';
  file_url: string;
  extracted_data?: Record<string, unknown>;
  confidence?: number;
}

// Print job
export interface PrintJob extends BaseJob {
  type: 'print';
  receipt_id: string;
  printer_id?: string;
  copies?: number;
}

// Report generation job
export interface ReportJob extends BaseJob {
  type: 'report';
  report_type: string;
  parameters: Record<string, unknown>;
  download_url?: string;
  file_size?: number;
}

// WhatsApp campaign job
export interface WhatsAppJob extends BaseJob {
  type: 'whatsapp';
  campaign_id: string;
  total_recipients: number;
  sent_count?: number;
  failed_count?: number;
  delivery_rate?: number;
}

// Generic job response from API
export interface JobResponse<T = unknown> {
  job: T;
  message?: string;
}

// Job creation request
export interface CreateJobRequest {
  type: string;
  parameters?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

// Job list response
export interface JobListResponse {
  jobs: BaseJob[];
  total: number;
  page: number;
  pages: number;
}

// Progress information
export interface JobProgress {
  percentage: number;
  current_step?: string;
  total_steps?: number;
  estimated_remaining?: number; // seconds
}

// Helper type guards
export const isTerminalStatus = (status: JobStatus): boolean => 
  ['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(status);

export const isActiveStatus = (status: JobStatus): boolean => 
  ['PENDING', 'PROCESSING', 'RETRYING'].includes(status);

export const isFailedStatus = (status: JobStatus): boolean => 
  ['FAILED', 'EXPIRED'].includes(status);
