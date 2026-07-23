import { PrismaClient } from '@prisma/client';
import { env } from '@/config/env';

/**
 * Single shared PrismaClient instance for the whole process.
 *
 * Avoid creating a `new PrismaClient()` per-request (or per-module)
 * because each instance opens its own connection pool — under load,
 * that quickly exhausts Postgres's max_connections.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
