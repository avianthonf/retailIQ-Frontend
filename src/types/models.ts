/**
 * src/types/models.ts
 * Oracle Document sections consumed: 2, 4, 5, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
export type UserRole = 'owner' | 'staff';
export type ChainRole = 'CHAIN_OWNER';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
export type ProductUom = 'pieces' | 'kg' | 'litre' | 'pack';
export type EventType = 'HOLIDAY' | 'FESTIVAL' | 'PROMOTION' | 'SALE_DAY' | 'CLOSURE';
export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'FULFILLED' | 'CANCELLED';
export type OcrJobStatus = 'QUEUED' | 'PROCESSING' | 'REVIEW' | 'FAILED' | 'COMPLETED';
export type PrintJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
export type CreditTransactionType = 'CREDIT' | 'DEBIT' | 'ADJUST';
export type PaymentProviderType = 'UPI' | 'CARD' | 'WALLET' | 'NETBANKING' | 'BANK_TRANSFER';

export interface CurrentUser {
  user_id: number;
  mobile_number?: string;
  full_name?: string;
  email?: string;
  role: UserRole | null;
  store_id: number | null;
  chain_group_id?: string | null;
  chain_role?: ChainRole | null;
  is_active?: boolean;
  mfa_enabled?: boolean;
  failed_login_attempts?: number;
  locked_until?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user_id: number;
  role: UserRole | null;
  store_id: number | null;
}

export interface StoreProfile {
  store_id: number;
  owner_user_id: number;
  store_name: string;
  store_type: string | null;
  city: string | null;
  state: string | null;
  gst_number: string | null;
  currency_symbol: string | null;
  working_days: string[];
  opening_time: string | null;
  closing_time: string | null;
  timezone: string | null;
}

export interface Category {
  category_id: number;
  store_id: number;
  name: string;
  color_tag: string | null;
  is_active: boolean;
  gst_rate: number | null;
}

export interface Product {
  product_id: number;
  store_id: number;
  category_id: number | null;
  name: string;
  sku_code: string;
  uom: ProductUom | null;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number | null;
  supplier_name: string | null;
  barcode: string | null;
  image_url: string | null;
  is_active: boolean;
  lead_time_days: number | null;
  hsn_code: string | null;
}

export interface TransactionLineItem {
  product_id: number;
  quantity: number;
  selling_price: number;
  discount_amount?: number | null;
}

export interface TransactionSummaryRow {
  transaction_id: string;
  created_at: string;
  payment_mode: PaymentMode;
  customer_id: number | null;
  is_return: boolean;
}

export interface TransactionDetail extends TransactionSummaryRow {
  notes: string | null;
  original_transaction_id: string | null;
  line_items: TransactionLineItem[];
}

export interface ReceiptTemplate {
  header_text: string | null;
  footer_text: string | null;
  show_gstin: boolean;
  paper_width_mm: number | null;
}

export interface PrintJob {
  job_id: number;
  store_id: number;
  transaction_id: string | null;
  job_type: string;
  status: PrintJobStatus;
  created_at: string;
  completed_at: string | null;
}

export interface OcrJobItem {
  item_id: string;
  raw_text: string;
  matched_product_id: number | null;
  product_name: string | null;
  confidence: number;
  quantity: number | null;
  unit_price: number | null;
  is_confirmed: boolean;
}

export interface OcrJob {
  job_id: string;
  status: OcrJobStatus;
  error_message: string | null;
  items: OcrJobItem[];
}

export interface PaymentProvider {
  code: string;
  name: string;
  type: PaymentProviderType;
  supported_methods: string[];
}

export interface KycProvider {
  code: string;
  name: string;
  type: string;
  id_label: string;
  required_fields: string[];
  is_mandatory: boolean;
}

export interface KycRecord {
  provider_name: string;
  status: string;
  country_code: string;
  verified_at: string | null;
}

export interface Supplier {
  id: number;
  store_id: number;
  name: string;
  contact: string | null;
  is_active: boolean;
  analytics?: Record<string, unknown> | null;
  sourced_products?: unknown[];
  recent_purchase_orders?: unknown[];
}

export interface PurchaseOrderItem {
  product_id: number;
  quantity: number;
  unit_cost: number;
  received_quantity?: number | null;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  status: PurchaseOrderStatus;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  payment_status: string | null;
  financed: boolean;
  loan_id: number | null;
  created_at: string;
  expected_delivery: string | null;
  shipping_tracking: string | null;
  items: PurchaseOrderItem[];
}

export interface StoreTaxRate {
  category_id: number;
  name: string;
  gst_rate: number;
}

export interface StoreTaxConfig {
  taxes: StoreTaxRate[];
}

export interface LoyaltyProgram {
  points_per_rupee: number;
  redemption_rate: number;
  min_redemption_points: number;
  expiry_days: number;
  is_active: boolean;
}

export interface LoyaltyTransaction {
  id: number;
  type: LoyaltyTransactionType;
  points: number;
  created_at: string;
  notes: string | null;
}

export interface CreditLedgerEntry {
  id: number;
  type: CreditTransactionType;
  amount: number;
  created_at: string;
  notes: string | null;
}

export interface ChainGroup {
  id: string;
  name: string;
  owner_user_id: number;
  group_id?: string;
}

export interface MarketSignal {
  id: string;
  topic: string;
  title: string;
  severity: string;
  acknowledged: boolean;
}

export interface EventRecord {
  id: number;
  title: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
}
