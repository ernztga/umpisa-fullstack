import type { GraphQLContext } from '@/graphql/context';
import { registerSchema, loginSchema } from '@/validation/authSchemas';
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  toPublicUser,
  getUserFromRefreshToken,
} from '@/services/authService';
import { setAuthCookies, clearAuthCookies, getRefreshTokenCookieName } from '@/utils/cookies';
import { AuthenticationError } from '@/errors/AppError';
import { requireAuth } from '../requireAuth';
import { updateProfileSchema } from '@/validation/userSchemas';
import { updateUserProfile } from '@/services/userService';

export const authResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      if (!context.user) return null;
      const user = await context.prisma.user.findUnique({ where: { id: context.user.id } });
      return user ? toPublicUser(user) : null;
    },
  },
  Mutation: {
    register: async (_parent: unknown, args: { input: unknown }, context: GraphQLContext) => {
      const input = registerSchema.parse(args.input);
      const { user, tokens } = await registerUser(context.prisma, input);
      setAuthCookies(context.res, tokens.accessToken, tokens.refreshToken);
      return { user };
    },

    login: async (_parent: unknown, args: { input: unknown }, context: GraphQLContext) => {
      const input = loginSchema.parse(args.input);
      const { user, tokens } = await loginUser(context.prisma, input);
      setAuthCookies(context.res, tokens.accessToken, tokens.refreshToken);
      return { user };
    },

    refreshToken: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const incomingToken = context.req.cookies?.[getRefreshTokenCookieName()] as
        string | undefined;
      if (!incomingToken) {
        throw new AuthenticationError('No active session found. Please log in.');
      }

      // Resolve the user BEFORE rotation revokes the old token, using the
      // still-valid incoming token.
      const user = await getUserFromRefreshToken(context.prisma, incomingToken);

      const tokens = await refreshUserSession(context.prisma, incomingToken);
      setAuthCookies(context.res, tokens.accessToken, tokens.refreshToken);

      return { user };
    },

    logout: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const refreshToken = context.req.cookies?.[getRefreshTokenCookieName()] as string | undefined;
      if (refreshToken) {
        await logoutUser(context.prisma, refreshToken);
      }
      clearAuthCookies(context.res);
      return true;
    },

    updateProfile: requireAuth((_parent: unknown, args: { input: unknown }, context) => {
      const input = updateProfileSchema.parse(args.input);
      return updateUserProfile(context.prisma, context.user.id, input);
    }),
  },
};
