import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid 6-digit hex code (e.g. #6366F1)');

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Category name is too long'),
  color: hexColorSchema.default('#6366F1'),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Category name is required').max(50).optional(),
    color: hexColorSchema.optional(),
  })
  // Prevents a meaningless "update with nothing changed" call, which
  // would otherwise silently succeed and do a no-op DB write.
  .refine((data) => data.name !== undefined || data.color !== undefined, {
    message: 'At least one field (name or color) must be provided.',
  });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
