import type { Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';

/**
 * Shape of the `user` object attached to context once a request has
 * been authenticated (populated by JWT middleware). `null`
 * means the request is unauthenticated — resolvers that require auth
 * check for this explicitly rather than assuming it's always present.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * The object available as the third argument to every GraphQL resolver.
 * Built fresh per-request in the Apollo `context` function.
 */
export interface GraphQLContext {
  req: Request;
  res: Response;
  prisma: PrismaClient;
  user: AuthenticatedUser | null;
}
