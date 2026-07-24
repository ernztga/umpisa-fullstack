import { Decimal } from '@prisma/client/runtime/library';

/**
 * Centralized, single, shared conversion from Prisma's Decimal 
 * type to a JSON-safe string for GraphQL responses. 
 */
export function serializeAmount(amount: Decimal): string {
  return amount.toFixed(2);
}

/**
 * Regex-based validation for a monetary amount string: optional
 * leading digits, optional exactly-2-decimal-place fraction, must be
 * positive. Used by the Zod expense schemas below instead of a plain
 * z.number()
 */
export const MONEY_STRING_REGEX = /^\d+(\.\d{1,2})?$/;
