import pinoHttp from 'pino-http';
import { randomUUID } from 'node:crypto';
import { logger } from '@/config/logger';

/**
 * Express middleware that logs one structured line per request/response
 * pair, including method, path, status code, response time, and a
 * unique request ID (so a single request can be traced across multiple
 * log lines if resolvers log additional context).
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id']?.toString() ?? randomUUID(),
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Keep logs concise: we don't need full request/response bodies logged
  // on every single request, just metadata. Sensitive fields are already
  // redacted at the logger level as a second line of defense.
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
