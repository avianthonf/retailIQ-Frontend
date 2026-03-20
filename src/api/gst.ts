/**
 * src/api/gst.ts
 * GST and Tax API
 */
import { apiClient } from './client';

// GST types
export interface GSTConfig {
  gstin: string;
  trade_name: string;
  address: string;
  state_code: string;
  is_composite: boolean;
  return_frequency: 'MONTHLY' | 'QUARTERLY';
  auto_calculation: boolean;
  cess_rate?: number;
}

export interface GSTSummary {
  period: string;
  total_turnover: number;
  taxable_turnover: number;
  total_tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  turnover_exempted: number;
  turnover_nil_rated: number;
  turnover_non_gst: number;
}

export interface GSTR1Return {
  period: string;
  status: 'DRAFT' | 'READY' | 'FILED' | 'ERROR';
  filed_on?: string;
  acknowledgement_number?: string;
  b2b_invoices: GSTR1Invoice[];
  b2c_large_invoices: GSTR1Invoice[];
  b2c_small_invoices: GSTR1Invoice[];
  cdnr_notes: GSTR1CreditNote[];
  export_invoices: GSTR1Invoice[];
}

export interface GSTR1Invoice {
  invoice_number: string;
  invoice_date: string;
  customer_gstin?: string;
  customer_name: string;
  place_of_supply: string;
  reverse_charge: 'Y' | 'N';
  invoice_type: 'REGULAR' | 'DE' | 'SEZ' | 'EXP';
  taxable_value: number;
  tax_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
}

export interface GSTR1CreditNote {
  note_number: string;
  note_date: string;
  customer_gstin?: string;
  customer_name: string;
  place_of_supply: string;
  reverse_charge: 'Y' | 'N';
  note_type: 'C' | 'D';
  taxable_value: number;
  tax_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
}

export interface HSNSearchResult {
  hsn_code: string;
  description: string;
  tax_rate: number;
  cess_rate?: number;
  category: string;
}

export interface GSTLiabilitySlab {
  turnover_range: {
    min: number;
    max?: number;
  };
  registration_required: boolean;
  return_frequency: 'MONTHLY' | 'QUARTERLY';
  composition_scheme_eligible: boolean;
}

export interface TaxConfig {
  tax_rates: {
    cgst: number;
    sgst: number;
    igst: number;
    cess?: number;
  };
  tax_categories: TaxCategory[];
  hsn_mappings: HSNMapping[];
}

export interface TaxCategory {
  id: string;
  name: string;
  tax_rate: number;
  cess_rate?: number;
  is_exempted: boolean;
  is_nil_rated: boolean;
}

export interface HSNMapping {
  hsn_code: string;
  category_id: string;
  tax_rate: number;
  description: string;
}

export interface TaxCalculationRequest {
  items: TaxCalculationItem[];
  place_of_supply: string;
  reverse_charge: boolean;
}

export interface TaxCalculationItem {
  amount: number;
  tax_category_id?: string;
  hsn_code?: string;
  quantity?: number;
}

export interface TaxCalculationResponse {
  total_amount: number;
  total_tax: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  item_breakup: TaxCalculationItemBreakup[];
}

export interface TaxCalculationItemBreakup {
  amount: number;
  tax_rate: number;
  cess_rate?: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_amount: number;
}

// GST API
export const gstApi = {
  // GST Configuration
  getGSTConfig: async (): Promise<GSTConfig> => {
    const response = await apiClient.get('/gst/config');
    return response.data;
  },

  updateGSTConfig: async (data: Partial<GSTConfig>): Promise<GSTConfig> => {
    const response = await apiClient.put('/gst/config', data);
    return response.data;
  },

  // GST Summary
  getGSTSummary: async (period: string): Promise<GSTSummary> => {
    const response = await apiClient.get(`/gst/summary/${period}`);
    return response.data;
  },

  // GSTR-1 Returns
  getGSTR1: async (period: string): Promise<GSTR1Return> => {
    const response = await apiClient.get(`/gst/gstr1/${period}`);
    return response.data;
  },

  generateGSTR1: async (period: string): Promise<GSTR1Return> => {
    const response = await apiClient.post(`/gst/gstr1/${period}/generate`);
    return response.data;
  },

  fileGSTR1: async (period: string): Promise<{ acknowledgement_number: string }> => {
    const response = await apiClient.post(`/gst/gstr1/${period}/file`);
    return response.data;
  },

  // HSN Search
  searchHSN: async (query: string): Promise<HSNSearchResult[]> => {
    const response = await apiClient.get('/gst/hsn/search', {
      params: { q: query }
    });
    return response.data;
  },

  // GST Liability Slabs
  getLiabilitySlabs: async (): Promise<GSTLiabilitySlab[]> => {
    const response = await apiClient.get('/gst/liability-slabs');
    return response.data;
  },

  // Tax Configuration
  getTaxConfig: async (): Promise<TaxConfig> => {
    const response = await apiClient.get('/tax/config');
    return response.data;
  },

  updateTaxConfig: async (data: Partial<TaxConfig>): Promise<TaxConfig> => {
    const response = await apiClient.put('/tax/config', data);
    return response.data;
  },

  // Tax Calculation
  calculateTax: async (data: TaxCalculationRequest): Promise<TaxCalculationResponse> => {
    const response = await apiClient.post('/tax/calculate', data);
    return response.data;
  },

  // Tax Categories
  getTaxCategories: async (): Promise<TaxCategory[]> => {
    const response = await apiClient.get('/tax/categories');
    return response.data;
  },

  createTaxCategory: async (data: Omit<TaxCategory, 'id'>): Promise<TaxCategory> => {
    const response = await apiClient.post('/tax/categories', data);
    return response.data;
  },

  updateTaxCategory: async (id: string, data: Partial<TaxCategory>): Promise<TaxCategory> => {
    const response = await apiClient.put(`/tax/categories/${id}`, data);
    return response.data;
  },

  deleteTaxCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/tax/categories/${id}`);
  },

  // HSN Mappings
  getHSNMappings: async (): Promise<HSNMapping[]> => {
    const response = await apiClient.get('/tax/hsn-mappings');
    return response.data;
  },

  createHSNMapping: async (data: Omit<HSNMapping, 'hsn_code'> & { hsn_code: string }): Promise<HSNMapping> => {
    const response = await apiClient.post('/tax/hsn-mappings', data);
    return response.data;
  },

  updateHSNMapping: async (hsn_code: string, data: Partial<HSNMapping>): Promise<HSNMapping> => {
    const response = await apiClient.put(`/tax/hsn-mappings/${hsn_code}`, data);
    return response.data;
  },

  deleteHSNMapping: async (hsn_code: string): Promise<void> => {
    await apiClient.delete(`/tax/hsn-mappings/${hsn_code}`);
  },
};
