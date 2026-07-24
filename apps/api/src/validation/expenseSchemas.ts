import { z } from 'zod';
import { MONEY_STRING_REGEX } from '@/utils/money';

const amountSchema = z
  .string()
  .regex(MONEY_STRING_REGEX, 'Amount must be a positive number with up to 2 decimal places')
  .refine((val) => Number(val) > 0, 'Amount must be greater than zero');

const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3, 'Currency must be a 3-letter ISO 4217 code (e.g. PHP, USD, EUR)');

export const createExpenseSchema = z.object({
  amount: amountSchema,
  currency: currencySchema.default('PHP'),
  description: z.string().trim().min(1, 'Description is required').max(200),
  date: z.coerce.date({
    error: 'A valid date is required.',
  }),
  categoryId: z.string().uuid('Invalid category id').optional().nullable(),
});

export const updateExpenseSchema = z
  .object({
    amount: amountSchema.optional(),
    currency: currencySchema.optional(),
    description: z.string().trim().min(1).max(200).optional(),
    date: z.coerce.date().optional(),
    categoryId: z.string().uuid('Invalid category id').optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided to update.',
  });

export const expenseFilterSchema = z
  .object({
    categoryId: z.string().uuid().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    description: z.string().trim().min(1).max(200).optional(),
    minAmount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount')
      .optional(),
    maxAmount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid amount')
      .optional(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    message: 'startDate must be before or equal to endDate',
  })
  .refine(
    (data) =>
      !data.minAmount || !data.maxAmount || Number(data.minAmount) <= Number(data.maxAmount),
    { message: 'minAmount must be less than or equal to maxAmount' },
  );

export const expenseSortFieldSchema = z.enum(['date', 'description', 'category', 'amount']);
export const sortDirectionSchema = z.enum(['asc', 'desc']);

export type ExpenseSortField = z.infer<typeof expenseSortFieldSchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilterInput = z.infer<typeof expenseFilterSchema>;
