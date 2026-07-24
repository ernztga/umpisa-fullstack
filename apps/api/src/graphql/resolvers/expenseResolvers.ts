import { GraphQLScalarType, Kind } from 'graphql';
import { requireAuth } from '@/graphql/requireAuth';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseFilterSchema,
} from '@/validation/expenseSchemas';
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '@/services/expenseService';
import { getExchangeRate } from '@/services/fxService';
import { serializeAmount } from '@/utils/money';
import type { Expense } from '@prisma/client';

/**
 * Serializes to/from ISO 8601 strings. Kept as a single
 * shared scalar definition rather than passing raw Date
 * objects through the schema untyped.
 */
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO 8601 date-time string',
  serialize: (value) => (value instanceof Date ? value.toISOString() : String(value)),
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});

export const expenseResolvers = {
  DateTime: dateTimeScalar,

  Expense: {
    amount: (parent: Expense) => serializeAmount(parent.amount),

    convertedAmount: async (
      parent: Expense,
      args: { targetCurrency: string },
    ): Promise<string | null> => {
      const rate = await getExchangeRate(parent.currency, args.targetCurrency.toUpperCase());
      if (rate === null) return null;
      return (Number(parent.amount) * rate).toFixed(2);
    },

    category: (parent: Expense & { category: unknown }) => parent.category,
  },

  Query: {
    expenses: requireAuth(
      async (
        _parent: unknown,
        args: { first?: number; after?: string; filter?: unknown },
        context,
      ) => {
        const filter = args.filter ? expenseFilterSchema.parse(args.filter) : undefined;
        const result = await listExpenses(context.prisma, context.user.id, {
          first: args.first,
          after: args.after,
          filter,
        });
        return {
          items: result.items,
          hasNextPage: result.hasNextPage,
          endCursor: result.endCursor,
        };
      },
    ),
  },

  Mutation: {
    createExpense: requireAuth((_parent: unknown, args: { input: unknown }, context) => {
      const input = createExpenseSchema.parse(args.input);
      return createExpense(context.prisma, context.user.id, input);
    }),

    updateExpense: requireAuth(
      (_parent: unknown, args: { id: string; input: unknown }, context) => {
        const input = updateExpenseSchema.parse(args.input);
        return updateExpense(context.prisma, context.user.id, args.id, input);
      },
    ),

    deleteExpense: requireAuth((_parent: unknown, args: { id: string }, context) => {
      return deleteExpense(context.prisma, context.user.id, args.id);
    }),
  },
};
