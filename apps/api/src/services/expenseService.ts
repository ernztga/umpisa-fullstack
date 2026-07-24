import type { Expense, PrismaClient, Prisma } from '@prisma/client';
import { assertOwnership } from '@/utils/ownership';
import { NotFoundError } from '@/errors/AppError';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseFilterInput,
} from '@/validation/expenseSchemas';

export interface PaginatedExpenses {
  items: Expense[];
  hasNextPage: boolean;
  endCursor: string | null;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Builds the Prisma `where` clause shared by both the paginated list
 * query and any future "total for these filters" aggregate query
 */
function buildExpenseWhere(userId: string, filter?: ExpenseFilterInput): Prisma.ExpenseWhereInput {
  return {
    userId,
    ...(filter?.categoryId && { categoryId: filter.categoryId }),
    ...(filter?.startDate || filter?.endDate
      ? {
          date: {
            ...(filter?.startDate && { gte: filter.startDate }),
            ...(filter?.endDate && { lte: filter.endDate }),
          },
        }
      : {}),
  };
}

/**
 * Cursor-paginated expense list, newest first. `after` is the id of
 * the last expense seen on the previous page (Relay-style cursor).
 * Caps `first` at MAX_PAGE_SIZE to prevent a client from requesting
 * an unbounded page size that would force a full table scan.
 */
export async function listExpenses(
  prisma: PrismaClient,
  userId: string,
  options: { first?: number; after?: string; filter?: ExpenseFilterInput },
): Promise<PaginatedExpenses> {
  const take = Math.min(options.first ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const where = buildExpenseWhere(userId, options.filter);

  const items = await prisma.expense.findMany({
    where,
    take: take + 1,
    ...(options.after && { cursor: { id: options.after }, skip: 1 }),
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    include: { category: true }, // eager-load to avoid N+1 in the GraphQL Expense.category resolver
  });

  const hasNextPage = items.length > take;
  const pageItems = hasNextPage ? items.slice(0, take) : items;

  return {
    items: pageItems,
    hasNextPage,
    endCursor: pageItems.length > 0 ? pageItems[pageItems.length - 1]!.id : null,
  };
}

export async function createExpense(
  prisma: PrismaClient,
  userId: string,
  input: CreateExpenseInput,
): Promise<Expense> {
  if (input.categoryId) {
    await assertCategoryBelongsToUser(prisma, userId, input.categoryId);
  }

  return prisma.expense.create({
    data: {
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      date: input.date,
      userId,
      categoryId: input.categoryId ?? null,
    },
    include: { category: true },
  });
}

export async function updateExpense(
  prisma: PrismaClient,
  userId: string,
  expenseId: string,
  input: UpdateExpenseInput,
): Promise<Expense> {
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  const expense = assertOwnership(existing, userId, 'Expense');

  if (input.categoryId) {
    await assertCategoryBelongsToUser(prisma, userId, input.categoryId);
  }

  return prisma.expense.update({
    where: { id: expense.id },
    data: {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
    },
    include: { category: true },
  });
}

export async function deleteExpense(
  prisma: PrismaClient,
  userId: string,
  expenseId: string,
): Promise<Expense> {
  const existing = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { category: true },
  });
  const expense = assertOwnership(existing, userId, 'Expense');
  return prisma.expense.delete({ where: { id: expense.id } });
}

/**
 * Verifies a categoryId actually belongs to the current user - prevents
 * a user from attaching their expense to someone else's category id.
 */
async function assertCategoryBelongsToUser(
  prisma: PrismaClient,
  userId: string,
  categoryId: string,
): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== userId) {
    throw new NotFoundError('Category not found.');
  }
}
