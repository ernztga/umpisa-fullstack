import { z } from 'zod';

export const updateProfileSchema = z.object({
  preferredCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'Currency must be a 3-letter ISO 4217 code (e.g. PHP / USD)'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
