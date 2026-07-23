import pino from 'pino';
import { env } from '@/config/env';

/**
 * Application-wide structured logger.
 *
 * - In development: pretty-printed, colorized, human-readable.
 * - In production: raw JSON (one object per line) for ingestion by
 *   log aggregators (CloudWatch etc.).
 *
 * `redact` strips sensitive values from logged objects even if a
 * developer accidentally logs a whole request/user object — this is
 * a safety net, not a substitute for being deliberate about what we log.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.body.password',
      'req.body.variables.password',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.accessToken',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
