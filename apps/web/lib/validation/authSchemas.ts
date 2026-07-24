import { z } from 'zod';

/**
 * Frontend-side mirror of the backend's authSchemas.ts (apps/api).
 * Deliberately NOT shared/imported across the monorepo boundary —
 * this copy exists purely for instant UX feedback; the backend copy
 * is the actual security enforcement. See Step 9 architectural
 * decision 2.3 for why these are intentionally two files, not one.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

export const registerFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: passwordSchema,
});

export const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
