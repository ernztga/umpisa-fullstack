import type { NextFunction, Request, Response } from 'express';
import { logger } from '@/config/logger';
import { env } from '@/config/env';

/**
 * Generic shape returned to clients for any unhandled REST error.
 */
interface ErrorResponseBody {
  error: {
    message: string;
    requestId?: string;
  };
}

/**
 * Express catch-all error middleware (must be registered LAST, after
 * all routes). Handles anything thrown/passed to `next(err)` in REST
 * routes (GraphQL errors are handled separately by Apollo's
 * `formatError`, see graphql/formatError.ts).
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  logger.error({ err, requestId: req.id }, 'Unhandled REST error');

  const body: ErrorResponseBody = {
    error: {
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : err.message,
      requestId: typeof req.id === 'string' ? req.id : undefined,
    },
  };

  res.status(500).json(body);
}
