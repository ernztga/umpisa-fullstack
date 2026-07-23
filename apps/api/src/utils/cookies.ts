import type { Response } from 'express';
import { env } from '@/config/env';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** Converts JWT expiry strings like "15m"/"7d" into milliseconds for cookie maxAge. */
function expiryToMs(expiry: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 0;
  const [, valueStr, unit] = match as unknown as [string, string, string];
  const value = Number(valueStr);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (unitMs[unit] ?? 0);
}

/**
 * Centralizes cookie options so login, register, and
 * refresh resolvers all set cookies IDENTICALLY
 */
function baseCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'strict';
} {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...baseCookieOptions(),
    maxAge: expiryToMs(env.JWT_ACCESS_EXPIRY),
    path: '/',
  });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: expiryToMs(env.JWT_REFRESH_EXPIRY),
    // Scoped narrowly: the refresh token is only ever needed by the
    // refreshToken mutation itself
    path: '/graphql',
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/graphql' });
}

export function getAccessTokenCookieName(): string {
  return ACCESS_TOKEN_COOKIE;
}

export function getRefreshTokenCookieName(): string {
  return REFRESH_TOKEN_COOKIE;
}
