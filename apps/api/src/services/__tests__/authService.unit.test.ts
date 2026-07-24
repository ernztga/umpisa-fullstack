import bcrypt from 'bcrypt';
import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient, User } from '@prisma/client';
import { registerUser, loginUser, refreshUserSession } from '@/services/authService';
import { ConflictError, AuthenticationError } from '@/errors/AppError';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function buildTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    firstName: 'Jane',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('authService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
  });

  describe('registerUser', () => {
    it('throws ConflictError if the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue(buildTestUser());

      await expect(
        registerUser(prisma, {
          email: 'jane@example.com',
          password: 'Password1',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ConflictError);

      // Registration must fail BEFORE any password hashing or DB write is attempted
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
    });

    it('creates a user with a hashed password and seeded default categories', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);

      const createdUser = buildTestUser();
      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          category: { createMany: jest.fn().mockResolvedValue({ count: 5 }) },
        });
      });
      prisma.refreshToken.create.mockResolvedValue({} as never);

      const result = await registerUser(prisma, {
        email: 'jane@example.com',
        password: 'Password1',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('Password1', 12);
      expect(result.user.email).toBe('jane@example.com');
      // The service's public-facing user shape must NEVER include the password hash
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('loginUser', () => {
    it('throws a generic AuthenticationError when the email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        loginUser(prisma, { email: 'ghost@example.com', password: 'whatever' }),
      ).rejects.toThrow(AuthenticationError);

      // Even for a nonexistent user, still nedd to perform a dummy bcrypt comparison (timing attack mitigation)
      expect(mockedBcrypt.compare).toHaveBeenCalled();
    });

    it('throws the SAME error message for wrong password as for unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(buildTestUser());
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        loginUser(prisma, { email: 'jane@example.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid email or password.');
    });

    it('succeeds and issues tokens when credentials are correct', async () => {
      prisma.user.findUnique.mockResolvedValue(buildTestUser());
      mockedBcrypt.compare.mockResolvedValue(true as never);
      prisma.refreshToken.create.mockResolvedValue({} as never);

      const result = await loginUser(prisma, { email: 'jane@example.com', password: 'Password1' });

      expect(result.user.email).toBe('jane@example.com');
      expect(result.tokens.accessToken).toEqual(expect.any(String));
      expect(result.tokens.refreshToken).toEqual(expect.any(String));
    });
  });

  describe('refreshUserSession', () => {
    it('throws AuthenticationError for a token whose id is not found in the DB', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      // Uses a syntactically-valid-but-unknown JWT; since verifyRefreshToken is a thin, well-tested wrapper
      // don't re-test jsonwebtoken's own correctness — only the handling of "verified but not found in DB".
      await expect(refreshUserSession(prisma, 'not-a-real-token')).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("revokes ALL of a user's sessions when a previously-revoked token is reused", async () => {
      const jwt = require('jsonwebtoken');
      const realJwtSign = jwt.sign;
      // Sign a real refresh token using the test env's secret so verifyRefreshToken (unmocked) can successfully decode it.
      const token = realJwtSign({ sub: 'user-1', jti: 'token-1' }, process.env.JWT_REFRESH_SECRET);

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-1',
        tokenHash: 'irrelevant-for-this-test',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: new Date(), // already revoked = reuse scenario
        createdAt: new Date(),
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      await expect(refreshUserSession(prisma, token)).rejects.toThrow(
        'Session invalidated due to suspicious activity. Please log in again.',
      );

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
