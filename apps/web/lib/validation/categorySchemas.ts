import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Pick a valid color'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
