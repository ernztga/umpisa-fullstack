import type { Request, Response } from 'express';
import { verifyAccessToken } from '@/utils/jwt';
import { getAccessTokenCookieName } from '@/utils/cookies';
import type { AuthenticatedUser } from '@/graphql/context';

/**
 * Attempts to authenticate the current request by verifying the
 * access-token cookie. Returns `null` (never throws) if absent/invalid
 * — GraphQL context building should never crash a request just because
 * the user happens to be logged out; individual resolvers decide
 * whether authentication is REQUIRED.
 */
export function authenticateRequest(req: Request, _res: Response): AuthenticatedUser | null {
  const token = req.cookies?.[getAccessTokenCookieName()] as string | undefined;
  if (!token) return null;

  try {
    const payload = verifyAccessToken(token);
    return { id: payload.sub, email: payload.email };
  } catch {
    // Expired or tampered token — treat identically to "not logged in"
    return null;
  }
}