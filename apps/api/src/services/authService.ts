import bcrypt from 'bcrypt';
import { randomUUID, createHash } from 'node:crypto';
import type { PrismaClient, User } from '@prisma/client';
import { AuthenticationError, ConflictError } from '@/errors/AppError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import type { RegisterInput, LoginInput } from '@/validation/authSchemas';
import { logger } from '@/config/logger';
import { DEFAULT_CATEGORIES } from '@/consts/defaultCategories';

const BCRYPT_COST_FACTOR = 12;

/** SHA-256 hash used to store refresh tokens at rest */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Public-safe user shape — NEVER includes passwordHash. */
export type PublicUser = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'createdAt'>;

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    createdAt: user.createdAt,
  };
}

/**
 * Issues a fresh access+refresh token pair for a user and persists the
 * refresh token's hash so it can be revoked later (logout, rotation).
 */
async function issueTokens(prisma: PrismaClient, user: User): Promise<AuthTokens> {
  const jti = randomUUID();
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, jti });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // sets 1 week expiry

  await prisma.refreshToken.create({
    data: {
      id: jti,
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

/**
 * Registers a new user: hashes the password, creates the user and
 * their default categories atomically, then issues session tokens.
 */
export async function registerUser(
  prisma: PrismaClient,
  input: RegisterInput,
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST_FACTOR);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({
        ...category,
        userId: createdUser.id,
      })),
    });

    return createdUser;
  });

  logger.info({ userId: user.id }, 'New user registered');

  const tokens = await issueTokens(prisma, user);
  return { user: toPublicUser(user), tokens };
}

/**
 * Authenticates a user by email+password.
 */
export async function loginUser(
  prisma: PrismaClient,
  input: LoginInput,
): Promise<{ user: PublicUser; tokens: AuthTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  const genericError = new AuthenticationError('Invalid email or password.');

  if (!user) {
    // Still perform comparison so the response time is indistinguishable from "wrong password"
    await bcrypt.compare(input.password, '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsal');
    throw genericError;
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw genericError;
  }

  logger.info({ userId: user.id }, 'User logged in');

  const tokens = await issueTokens(prisma, user);
  return { user: toPublicUser(user), tokens };
}

/**
 * Rotates a refresh token: verifies the incoming token, checks it
 * against the DB (must exist, not be revoked, not be expired), revokes
 * it, and issues a brand new access+refresh pair.
 *
 * Reuse detection: if the incoming token's jti maps to a DB row that
 * is already revoked, this is a signal the refresh token was stolen
 * and already used by an attacker (or the legitimate user, replaying
 * an old token) — respond by revoking ALL of that user's refresh
 * tokens, forcing every session to re-authenticate.
 */
export async function refreshUserSession(
  prisma: PrismaClient,
  incomingRefreshToken: string,
): Promise<AuthTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw new AuthenticationError('Invalid or expired session. Please log in again.');
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    throw new AuthenticationError('Invalid or expired session. Please log in again.');
  }

  if (storedToken.revokedAt) {
    logger.warn(
      { userId: payload.sub, tokenId: payload.jti },
      'Refresh token reuse detected — revoking all sessions for user',
    );
    await prisma.refreshToken.updateMany({
      where: { userId: payload.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AuthenticationError(
      'Session invalidated due to suspicious activity. Please log in again.',
    );
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AuthenticationError('Invalid or expired session. Please log in again.');
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(prisma, user);
}

/** Revokes a single refresh token (logout of current session only). */
export async function logoutUser(prisma: PrismaClient, refreshToken: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // If the token is already invalid/expired, logout is a no-op —
    // the end state the user wants (being logged out) is already true.
  }
}

export { toPublicUser };

/**
 * Verifies a refresh token and returns the associated user, without rotating anything. 
 */
export async function getUserFromRefreshToken(
  prisma: PrismaClient,
  refreshToken: string,
): Promise<PublicUser | null> {
  const payload = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  return user ? toPublicUser(user) : null;
}
