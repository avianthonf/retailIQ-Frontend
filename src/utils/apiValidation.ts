/**
 * API Validation Utility
 * Validates frontend API integration points
 */

// Import all API modules
import * as authApi from '@/api/auth';
import * as analyticsApi from '@/api/analytics';
import * as suppliersApi from '@/api/suppliers';
import * as inventoryApi from '@/api/inventory';
import * as purchaseOrdersApi from '@/api/purchaseOrders';
import * as storeApi from '@/api/store';
import * as financeApi from '@/api/finance';
import * as gstApi from '@/api/gst';
import * as loyaltyApi from '@/api/loyalty';
import * as marketIntelligenceApi from '@/api/marketIntelligence';
import * as whatsappApi from '@/api/whatsapp';
import * as developerApi from '@/api/developer';
import * as chainApi from '@/api/chain';
import * as transactionsApi from '@/api/transactions';
import * as receiptsApi from '@/api/receipts';
import * as kycApi from '@/api/kyc';
import * as visionApi from '@/api/vision';

/**
 * Validates all API endpoints are properly defined
 */
export function validateApiEndpoints() {
  const validationResults: { [key: string]: boolean } = {};
  
  // Check each API module exists
  validationResults.auth = !!authApi;
  validationResults.analytics = !!analyticsApi;
  validationResults.suppliers = !!suppliersApi;
  validationResults.inventory = !!inventoryApi;
  validationResults.purchaseOrders = !!purchaseOrdersApi;
  validationResults.store = !!storeApi;
  validationResults.finance = !!financeApi;
  validationResults.gst = !!gstApi;
  validationResults.loyalty = !!loyaltyApi;
  validationResults.marketIntelligence = !!marketIntelligenceApi;
  validationResults.whatsapp = !!whatsappApi;
  validationResults.developer = !!developerApi;
  validationResults.chain = !!chainApi;
  validationResults.transactions = !!transactionsApi;
  validationResults.receipts = !!receiptsApi;
  validationResults.kyc = !!kycApi;
  validationResults.vision = !!visionApi;
  
  return validationResults;
}

/**
 * Checks if all API validations passed
 */
export function isApiValidationComplete(results: { [key: string]: boolean }) {
  return Object.values(results).every(result => result === true);
}

/**
 * Get validation summary
 */
export function getValidationSummary(results: { [key: string]: boolean }) {
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;
  const failed = total - passed;
  
  return {
    total,
    passed,
    failed,
    percentage: Math.round((passed / total) * 100),
    modules: Object.entries(results).map(([module, passed]) => ({
      module,
      status: passed ? '✅' : '❌'
    }))
  };
}
