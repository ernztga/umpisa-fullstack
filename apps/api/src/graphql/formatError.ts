import type { GraphQLFormattedError } from 'graphql';
import { logger } from '@/config/logger';
import { env } from '@/config/env';

/**
 * Central place where every GraphQL error is shaped before being sent
 * to the client. Two goals:
 *  1. Log the FULL error server-side (for debugging).
 *  2. Send the client only a safe, minimal error shape — never a raw
 *     stack trace or internal Prisma/DB error message in production.
 */
export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  logger.error({ err: error }, 'GraphQL error');

  if (env.NODE_ENV === 'production') {
    return {
      message:
        formattedError.extensions?.['code'] === 'UNAUTHENTICATED'
          ? formattedError.message // safe, expected client-facing messages
          : 'An unexpected error occurred.',
      extensions: { code: formattedError.extensions?.['code'] ?? 'INTERNAL_SERVER_ERROR' },
    };
  }

  // In development, return full detail to speed up debugging.
  return formattedError;
}
