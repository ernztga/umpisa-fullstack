import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { env } from '@/config/env';
import { requestLogger } from '@/middleware/requestLogger';
import { errorHandler } from '@/middleware/errorHandler';
import { baseTypeDefs } from '@/graphql/typeDefs';
import { baseResolvers } from '@/graphql/resolvers';
import { buildContext } from '@/graphql/buildContext';
import { formatGraphQLError } from '@/graphql/formatError';
import { prisma } from '@/lib/prisma';

/**
 * Builds and returns a fully configured Express app with GraphQL
 * mounted at /graphql.
 */
export async function createApp(): Promise<Express> {
  const app = express();

  // Trust the first proxy hop (needed for correct client IPs behind
  // Docker/reverse proxies — affects rate limiting accuracy).
  app.set('trust proxy', 1);

  // --- Security & baseline middleware, in deliberate order ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true, // required: we send/receive httpOnly cookies
    }),
  );

  const globalRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true, // return RateLimit-* headers
    legacyHeaders: false,
    message: { error: { message: 'Too many requests. Please try again later.' } },
  });
  app.use(globalRateLimiter);

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestLogger);

  // --- Health check (plain REST, no GraphQL overhead) ---
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Apollo Server / GraphQL ---
  const apolloServer = new ApolloServer({
    typeDefs: baseTypeDefs,
    resolvers: baseResolvers,
    formatError: formatGraphQLError,
  });
  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => buildContext({ req, res, prisma }),
    }),
  );

  // --- Error handler must be registered LAST ---
  app.use(errorHandler);

  return app;
}
