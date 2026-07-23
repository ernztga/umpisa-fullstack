import type { Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { GraphQLContext } from '@/graphql/context';
import { authenticateRequest } from '@/middleware/authenticate';

interface BuildContextArgs {
  req: Request;
  res: Response;
  prisma: PrismaClient;
}

export async function buildContext({
  req,
  res,
  prisma,
}: BuildContextArgs): Promise<GraphQLContext> {
  return {
    req,
    res,
    prisma,
    user: authenticateRequest(req, res),
  };
}
