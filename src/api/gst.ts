/**
 * src/api/gst.ts
 * Backend-aligned GST adapters
 */
import { normalizeApiError } from '@/utils/errors';
import { request } from './client';
import * as storeApi from './store';

const GST_BASE = '/api/v1/gst';
const TAX_BASE = '/api/v1/tax';

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

interface RawGstConfig {
  gstin?: string | null;
  registration_type?: string;
  state_code?: string | null;
  is_gst_enabled?: boolean;
}

interface RawGstSummary {
  period?: string;
  total_taxable?: number;
  total_cgst?: number;
  total_sgst?: number;
  total_igst?: number;
  invoice_count?: number;
}

const currentPeriod = () => new Date().toISOString().slice(0, 7);

const mapCategory = (category: {
  category_id?: number | string;
  name?: string;
  gst_rate?: number | null;
}): TaxCategory => ({
  id: String(category.category_id ?? ''),
  name: category.name ?? '',
  tax_rate: Number(category.gst_rate ?? 0),
  cess_rate: 0,
  is_exempted: Number(category.gst_rate ?? 0) === 0,
  is_nil_rated: Number(category.gst_rate ?? 0) === 0,
});

const getTaxCategoriesInternal = async (): Promise<TaxCategory[]> => {
  const categories = await storeApi.listCategories();
  return Array.isArray(categories.categories) ? categories.categories.map(mapCategory) : [];
};

export const gstApi = {
  getGSTConfig: async (): Promise<GSTConfig> => {
    const response = await request<RawGstConfig>({ url: `${GST_BASE}/config`, method: 'GET' });

    return {
      gstin: response.gstin ?? '',
      trade_name: '',
      address: '',
      state_code: response.state_code ?? '',
      is_composite: response.registration_type === 'COMPOSITION',
      return_frequency: response.registration_type === 'COMPOSITION' ? 'QUARTERLY' : 'MONTHLY',
      auto_calculation: Boolean(response.is_gst_enabled),
      cess_rate: 0,
    };
  },

  updateGSTConfig: async (data: Partial<GSTConfig>): Promise<GSTConfig> => {
    await request<RawGstConfig>({
      url: `${GST_BASE}/config`,
      method: 'PUT',
      data: {
        gstin: data.gstin,
        registration_type: data.is_composite ? 'COMPOSITION' : 'REGULAR',
        state_code: data.state_code,
        is_gst_enabled: data.auto_calculation,
      },
    });

    return gstApi.getGSTConfig();
  },

  getGSTSummary: async (period: string): Promise<GSTSummary> => {
    const response = await request<RawGstSummary>({
      url: `${GST_BASE}/summary`,
      method: 'GET',
      params: { period },
    });

    const cgst = Number(response.total_cgst ?? 0);
    const sgst = Number(response.total_sgst ?? 0);
    const igst = Number(response.total_igst ?? 0);

    return {
      period: response.period ?? period,
      total_turnover: Number(response.total_taxable ?? 0),
      taxable_turnover: Number(response.total_taxable ?? 0),
      total_tax: cgst + sgst + igst,
      cgst,
      sgst,
      igst,
      cess: 0,
      turnover_exempted: 0,
      turnover_nil_rated: 0,
      turnover_non_gst: 0,
    };
  },

  getGSTR1: async (period: string): Promise<GSTR1Return> => {
    try {
      const response = await request<Record<string, unknown>>({
        url: `${GST_BASE}/gstr1`,
        method: 'GET',
        params: { period },
      });

      return {
        period,
        status: response.acknowledgement_number ? 'FILED' : 'READY',
        filed_on: typeof response.filed_on === 'string' ? response.filed_on : undefined,
        acknowledgement_number: typeof response.acknowledgement_number === 'string' ? response.acknowledgement_number : undefined,
        b2b_invoices: [],
        b2c_large_invoices: [],
        b2c_small_invoices: [],
        cdnr_notes: [],
        export_invoices: [],
      };
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 404) {
        return {
          period,
          status: 'DRAFT',
          b2b_invoices: [],
          b2c_large_invoices: [],
          b2c_small_invoices: [],
          cdnr_notes: [],
          export_invoices: [],
        };
      }
      throw error;
    }
  },

  generateGSTR1: async (period: string): Promise<GSTR1Return> => {
    await request<RawGstSummary>({
      url: `${GST_BASE}/summary`,
      method: 'GET',
      params: { period },
    });
    return gstApi.getGSTR1(period);
  },

  fileGSTR1: async (period: string): Promise<{ acknowledgement_number: string }> => {
    const response = await request<{ acknowledgement_number?: string }>({
      url: `${GST_BASE}/gstr1/file`,
      method: 'POST',
      data: { period },
    });
    return {
      acknowledgement_number: String(response.acknowledgement_number ?? ''),
    };
  },

  searchHSN: async (query: string): Promise<HSNSearchResult[]> => {
    const response = await request<Array<{ hsn_code?: string; description?: string; default_gst_rate?: number | null }>>({
      url: `${GST_BASE}/hsn-search`,
      method: 'GET',
      params: { q: query },
    });

    return Array.isArray(response)
      ? response.map((row) => ({
          hsn_code: String(row.hsn_code ?? ''),
          description: row.description ?? '',
          tax_rate: Number(row.default_gst_rate ?? 0),
          cess_rate: 0,
          category: row.description ?? '',
        }))
      : [];
  },

  getLiabilitySlabs: async (): Promise<GSTLiabilitySlab[]> => {
    const response = await request<Array<{ rate?: number }>>({
      url: `${GST_BASE}/liability-slabs`,
      method: 'GET',
      params: { period: currentPeriod() },
    });

    return Array.isArray(response)
      ? response.map((row) => ({
          turnover_range: {
            min: Number(row.rate ?? 0),
          },
          registration_required: true,
          return_frequency: 'MONTHLY',
          composition_scheme_eligible: false,
        }))
      : [];
  },

  getTaxConfig: async (): Promise<TaxConfig> => {
    const [categories, hsnMappings] = await Promise.all([
      getTaxCategoriesInternal(),
      gstApi.getHSNMappings(),
    ]);
    return {
      tax_rates: {
        cgst: 0,
        sgst: 0,
        igst: 0,
        cess: 0,
      },
      tax_categories: categories,
      hsn_mappings: hsnMappings,
    };
  },

  updateTaxConfig: async (_data: Partial<TaxConfig>): Promise<TaxConfig> => gstApi.getTaxConfig(),

  calculateTax: async (data: TaxCalculationRequest): Promise<TaxCalculationResponse> => {
    const response = await request<{ taxable_amount?: number; tax_amount?: number; breakdown?: Record<string, number> }>({
      url: `${TAX_BASE}/calculate`,
      method: 'POST',
      data: {
        country_code: 'IN',
        items: data.items.map((item) => ({
          amount: item.amount,
          quantity: item.quantity ?? 1,
          hsn_code: item.hsn_code,
        })),
      },
    });

    const taxableAmount = Number(response.taxable_amount ?? 0);
    const taxAmount = Number(response.tax_amount ?? 0);
    const cgst = Number(response.breakdown?.CGST ?? response.breakdown?.cgst ?? 0);
    const sgst = Number(response.breakdown?.SGST ?? response.breakdown?.sgst ?? 0);
    const igst = Number(response.breakdown?.IGST ?? response.breakdown?.igst ?? 0);
    const cess = Number(response.breakdown?.CESS ?? response.breakdown?.cess ?? 0);

    return {
      total_amount: taxableAmount + taxAmount,
      total_tax: taxAmount,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      cess_amount: cess,
      item_breakup: data.items.map((item) => ({
        amount: item.amount,
        tax_rate: item.amount ? (taxAmount / item.amount) * 100 : 0,
        cess_rate: 0,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        cess_amount: cess,
        total_amount: item.amount + taxAmount,
      })),
    };
  },

  getTaxCategories: async (): Promise<TaxCategory[]> => getTaxCategoriesInternal(),

  createTaxCategory: async (data: Omit<TaxCategory, 'id'>): Promise<TaxCategory> => {
    const response = await storeApi.createCategory({
      name: data.name,
      gst_rate: data.tax_rate,
      is_active: true,
      color_tag: null,
    });

    return mapCategory(response);
  },

  updateTaxCategory: async (id: string, data: Partial<TaxCategory>): Promise<TaxCategory> => {
    const response = await storeApi.updateCategory(id, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.tax_rate !== undefined ? { gst_rate: data.tax_rate } : {}),
      ...(data.is_exempted !== undefined ? { gst_rate: data.is_exempted ? 0 : data.tax_rate ?? 0 } : {}),
    });

    return mapCategory(response);
  },

  deleteTaxCategory: async (id: string): Promise<void> => {
    await storeApi.deleteCategory(id);
  },

  getHSNMappings: async (): Promise<HSNMapping[]> => {
    const response = await request<Array<{
      hsn_code?: string;
      category_id?: string;
      tax_rate?: number;
      description?: string;
    }>>({
      url: `${GST_BASE}/hsn-mappings`,
      method: 'GET',
    });

    return Array.isArray(response)
      ? response.map((mapping) => ({
          hsn_code: String(mapping.hsn_code ?? ''),
          category_id: String(mapping.category_id ?? ''),
          tax_rate: Number(mapping.tax_rate ?? 0),
          description: mapping.description ?? '',
        }))
      : [];
  },

  createHSNMapping: async (data: Omit<HSNMapping, 'hsn_code'> & { hsn_code: string }): Promise<HSNMapping> => {
    const response = await request<{
      hsn_code?: string;
      category_id?: string;
      tax_rate?: number;
      description?: string;
    }>({
      url: `${GST_BASE}/hsn-mappings`,
      method: 'POST',
      data,
    });
    return {
      hsn_code: String(response.hsn_code ?? data.hsn_code),
      category_id: String(response.category_id ?? data.category_id),
      tax_rate: Number(response.tax_rate ?? data.tax_rate),
      description: response.description ?? data.description,
    };
  },

  updateHSNMapping: async (hsn_code: string, data: Partial<HSNMapping>): Promise<HSNMapping> => {
    const response = await request<{
      hsn_code?: string;
      category_id?: string;
      tax_rate?: number;
      description?: string;
    }>({
      url: `${GST_BASE}/hsn-mappings/${hsn_code}`,
      method: 'PATCH',
      data,
    });
    return {
      hsn_code: String(response.hsn_code ?? hsn_code),
      category_id: String(response.category_id ?? data.category_id ?? ''),
      tax_rate: Number(response.tax_rate ?? data.tax_rate ?? 0),
      description: response.description ?? data.description ?? '',
    };
  },

  deleteHSNMapping: async (hsn_code: string): Promise<void> => {
    await request<{ hsn_code: string; deleted: boolean }>({
      url: `${GST_BASE}/hsn-mappings/${hsn_code}`,
      method: 'DELETE',
    });
  },
};
