import { z } from 'zod';

export const expenseFormSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (e.g. 42.50)')
    .refine((val) => Number(val) > 0, 'Amount must be greater than zero'),
  currency: z.string().length(3, 'Use a 3-letter currency code'),
  description: z.string().trim().min(1, 'Description is required').max(200),
  date: z.string().min(1, 'Date is required'),
  categoryId: z.string().uuid().nullable().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
