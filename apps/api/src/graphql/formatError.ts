import type { GraphQLFormattedError } from 'graphql';
import { GraphQLError } from 'graphql';
import { logger } from '@/config/logger';
import { env } from '@/config/env';
import { AppError } from '@/errors/AppError';

export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const originalError = error instanceof GraphQLError ? error.originalError : error;

  const isOperational = originalError instanceof AppError;

  logger.error(
    { err: error, isOperational },
    isOperational ? 'Operational error' : 'Unexpected error',
  );

  if (isOperational) {
    // User-facing message
    return {
      message: formattedError.message,
      extensions: { code: (originalError as AppError).code },
    };
  }

  // Unexpected/internal error: never leak details, even in development
  return {
    message:
      env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : formattedError.message,
    extensions: { code: 'INTERNAL_SERVER_ERROR' },
  };
}
