import type { GraphQLContext } from '@/graphql/context';

/**
 * Root resolver map. Feature resolvers (auth, category, expense) get
 * merged into `Query`/`Mutation` here as they're built.
 */
export const baseResolvers = {
  Query: {
    ping: (_parent: unknown, _args: unknown, _context: GraphQLContext): string => 'pong',
  },
};
