/**
 * src/api/finance.ts
 * Finance API - KYC, Credit, Loans, Treasury
 */
import { apiClient } from './client';

// Finance types
export interface KYCRecord {
  id: string;
  provider: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FAILED';
  submitted_at: string;
  verified_at?: string;
  rejection_reason?: string;
  reference_id: string;
}

export interface KYCSubmission {
  provider: string;
  document_type: string;
  document_number: string;
  full_name: string;
  date_of_birth: string;
  address: string;
}

export interface CreditScore {
  score: number;
  max_score: number;
  last_updated: string;
  factors: string[];
}

export interface CreditLedger {
  balance: number;
  available_credit: number;
  total_credit_limit: number;
  pending_charges: number;
  currency: string;
}

export interface CreditTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'PAYMENT';
  amount: number;
  description: string;
  created_at: string;
  balance_after: number;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  interest_rate: number;
  min_amount: number;
  max_amount: number;
  tenure_months: number;
  processing_fee: number;
}

export interface LoanApplication {
  id: string;
  product_id: string;
  amount: number;
  tenure_months: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';
  submitted_at: string;
  approved_at?: string;
  disbursed_at?: string;
  rejection_reason?: string;
  monthly_installment?: number;
}

export interface LoanApplicationRequest {
  product_id: string;
  amount: number;
  tenure_months: string;
  purpose?: string;
}

export interface FinancialAccount {
  id: string;
  type: 'CURRENT' | 'SAVINGS' | 'ESCROW';
  name: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  entry_type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  reference_id?: string;
  created_at: string;
  balance_after: number;
}

export interface TreasuryConfig {
  auto_transfer_enabled: boolean;
  reserve_percentage: number;
  daily_transfer_limit: number;
  settlement_account_id: string;
}

export interface TreasuryBalance {
  total_balance: number;
  available_balance: number;
  reserved_amount: number;
  pending_transfers: number;
  currency: string;
  last_updated: string;
}

export interface TreasuryTransaction {
  id: string;
  type: 'TRANSFER_IN' | 'TRANSFER_OUT' | 'PAYMENT' | 'REFUND';
  amount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  completed_at?: string;
}

// Finance API
export const financeApi = {
  // KYC
  submitKYC: async (data: KYCSubmission): Promise<KYCRecord> => {
    const response = await apiClient.post('/v2/finance/kyc', data);
    return response.data;
  },

  getKYCStatus: async (): Promise<KYCRecord> => {
    const response = await apiClient.get('/v2/finance/kyc');
    return response.data;
  },

  // Credit Score
  getCreditScore: async (): Promise<CreditScore> => {
    const response = await apiClient.get('/v2/finance/credit-score');
    return response.data;
  },

  refreshCreditScore: async (): Promise<CreditScore> => {
    const response = await apiClient.post('/v2/finance/credit-score/refresh');
    return response.data;
  },

  // Credit Ledger
  getCreditLedger: async (): Promise<CreditLedger> => {
    const response = await apiClient.get('/v2/finance/credit-ledger');
    return response.data;
  },

  getCreditTransactions: async (): Promise<CreditTransaction[]> => {
    const response = await apiClient.get('/v2/finance/credit-transactions');
    return response.data;
  },

  repayCredit: async (amount: number): Promise<CreditTransaction> => {
    const response = await apiClient.post('/v2/finance/credit-repayment', { amount });
    return response.data;
  },

  // Loans
  getLoanProducts: async (): Promise<LoanProduct[]> => {
    const response = await apiClient.get('/v2/finance/loan-products');
    return response.data;
  },

  getLoanApplications: async (): Promise<LoanApplication[]> => {
    const response = await apiClient.get('/v2/finance/loan-applications');
    return response.data;
  },

  applyForLoan: async (data: LoanApplicationRequest): Promise<LoanApplication> => {
    const response = await apiClient.post('/v2/finance/loan-applications', data);
    return response.data;
  },

  getLoanApplication: async (applicationId: string): Promise<LoanApplication> => {
    const response = await apiClient.get(`/v2/finance/loan-applications/${applicationId}`);
    return response.data;
  },

  // Accounts
  getFinancialAccounts: async (): Promise<FinancialAccount[]> => {
    const response = await apiClient.get('/v2/finance/accounts');
    return response.data;
  },

  getLedgerEntries: async (accountId?: string): Promise<LedgerEntry[]> => {
    const params = accountId ? { account_id: accountId } : {};
    const response = await apiClient.get('/v2/finance/ledger', { params });
    return response.data;
  },

  // Treasury
  getTreasuryBalance: async (): Promise<TreasuryBalance> => {
    const response = await apiClient.get('/v2/finance/treasury/balance');
    return response.data;
  },

  getTreasuryConfig: async (): Promise<TreasuryConfig> => {
    const response = await apiClient.get('/v2/finance/treasury/config');
    return response.data;
  },

  updateTreasuryConfig: async (data: Partial<TreasuryConfig>): Promise<TreasuryConfig> => {
    const response = await apiClient.put('/v2/finance/treasury/config', data);
    return response.data;
  },

  getTreasuryTransactions: async (): Promise<TreasuryTransaction[]> => {
    const response = await apiClient.get('/v2/finance/treasury/transactions');
    return response.data;
  },

  processPayment: async (data: {
    amount: number;
    method: string;
    reference?: string;
  }): Promise<TreasuryTransaction> => {
    const response = await apiClient.post('/v2/finance/payments', data);
    return response.data;
  },
};
