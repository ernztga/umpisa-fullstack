import { authResolvers } from '@/graphql/resolvers/authResolvers';
import { categoryResolvers } from '@/graphql/resolvers/categoryResolvers';
import { expenseResolvers } from '@/graphql/resolvers/expenseResolvers';
import type { GraphQLContext } from '@/graphql/context';

export const resolvers = {
  DateTime: expenseResolvers.DateTime,

  Expense: expenseResolvers.Expense,

  Query: {
    ping: (_parent: unknown, _args: unknown, _context: GraphQLContext): string => 'pong',
    ...authResolvers.Query,
    ...categoryResolvers.Query,
    ...expenseResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...categoryResolvers.Mutation,
    ...expenseResolvers.Mutation,
  },
};
