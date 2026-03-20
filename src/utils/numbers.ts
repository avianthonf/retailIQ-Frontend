/**
 * src/utils/numbers.ts
 * Oracle Document sections consumed: 5, 12
 * Last item from Section 11 risks addressed here: Numeric serialization is inconsistent
 */
import Decimal from 'decimal.js';

/** Oracle section 12.5: normalize transport money values that may arrive as floats or strings. */
export const parseMoney = (raw: string | number | Decimal) => new Decimal(raw);

/** Oracle section 12.5: display money values with consistent rounding. */
export const formatCurrency = (value: string | number | Decimal, currency?: string) => {
  const decimal = new Decimal(value);
  const symbol = currency || '₹'; // Default to INR based on Oracle context
  return `${symbol}${decimal.toFixed(2)}`;
};

/** Oracle section 12.5: serialize money values back to the API transport format. */
export const toApiMoney = (value: Decimal) => value.toNumber();
