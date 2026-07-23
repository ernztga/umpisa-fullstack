import { authResolvers } from '@/graphql/resolvers/authResolvers';
import type { GraphQLContext } from '@/graphql/context';

export const resolvers = {
  Query: {
    ping: (_parent: unknown, _args: unknown, _context: GraphQLContext): string => 'pong',
    ...authResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
  },
};
