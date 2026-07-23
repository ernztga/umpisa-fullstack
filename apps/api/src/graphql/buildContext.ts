import type { Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { GraphQLContext } from '@/graphql/context';

interface BuildContextArgs {
  req: Request;
  res: Response;
  prisma: PrismaClient;
}

/**
 * Builds the per-request GraphQL context.
 */
export async function buildContext({
  req,
  res,
  prisma,
}: BuildContextArgs): Promise<GraphQLContext> {
  return {
    req,
    res,
    prisma,
    user: null,
  };
}
