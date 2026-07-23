import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Schema describing every environment variable this service requires.
 * Parsed ONCE at process start. If any variable is missing or malformed,
 * the process throws immediately and refuses to boot — we never want a
 * misconfiguration to surface later as a confusing runtime error deep
 * inside a resolver.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  CORS_ORIGIN: z.string().url(),

  FX_API_BASE_URL: z.string().url().default('https://api.exchangerate.host'),
});

/**
 * Parsed, typed, validated environment config. Import this everywhere
 * instead of touching `process.env` directly — it guarantees every
 * consumer gets the correct type (e.g. numbers are real numbers) and
 * guarantees the app never even starts in a half-configured state.
 */
export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
