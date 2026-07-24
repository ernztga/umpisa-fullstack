import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient, Expense, Category } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createExpense, updateExpense, listExpenses } from '@/services/expenseService';
import { NotFoundError } from '@/errors/AppError';

function buildTestExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'exp-1',
    amount: new Decimal('42.5'),
    currency: 'USD',
    description: 'Groceries',
    date: new Date('2026-07-20'),
    userId: 'user-1',
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildTestCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    name: 'Food',
    color: '#F59E0B',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('expenseService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
  });

  describe('createExpense', () => {
    it('rejects a categoryId that belongs to a different user', async () => {
      prisma.category.findUnique.mockResolvedValue(buildTestCategory({ userId: 'someone-else' }));

      await expect(
        createExpense(prisma, 'user-1', {
          amount: '10.00',
          currency: 'USD',
          description: 'Coffee',
          date: new Date(),
          categoryId: 'cat-1',
        }),
      ).rejects.toThrow(NotFoundError);

      expect(prisma.expense.create).not.toHaveBeenCalled();
    });

    it('creates the expense when the category belongs to the same user', async () => {
      prisma.category.findUnique.mockResolvedValue(buildTestCategory());
      prisma.expense.create.mockResolvedValue(buildTestExpense({ categoryId: 'cat-1' }));

      const result = await createExpense(prisma, 'user-1', {
        amount: '42.50',
        currency: 'USD',
        description: 'Groceries',
        date: new Date('2026-07-20'),
        categoryId: 'cat-1',
      });

      expect(result.description).toBe('Groceries');
    });

    it('creates an uncategorized expense when no categoryId is provided', async () => {
      prisma.expense.create.mockResolvedValue(buildTestExpense({ categoryId: null }));

      await createExpense(prisma, 'user-1', {
        amount: '15.00',
        currency: 'USD',
        description: 'Snack',
        date: new Date(),
      });

      // No category lookup should happen at all if none was supplied.
      expect(prisma.category.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('updateExpense (ownership enforcement)', () => {
    it('refuses to update an expense owned by a different user', async () => {
      prisma.expense.findUnique.mockResolvedValue(buildTestExpense({ userId: 'someone-else' }));

      await expect(
        updateExpense(prisma, 'user-1', 'exp-1', { description: 'Hacked' }),
      ).rejects.toThrow(NotFoundError);

      expect(prisma.expense.update).not.toHaveBeenCalled();
    });

    it('allows clearing a category by passing categoryId: null explicitly', async () => {
      prisma.expense.findUnique.mockResolvedValue(buildTestExpense({ categoryId: 'cat-1' }));
      prisma.expense.update.mockResolvedValue(buildTestExpense({ categoryId: null }));

      await updateExpense(prisma, 'user-1', 'exp-1', { categoryId: null });

      expect(prisma.expense.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ categoryId: null }) }),
      );
    });
  });

  describe('listExpenses (pagination)', () => {
    it('caps the page size at MAX_PAGE_SIZE even if a larger value is requested', async () => {
      prisma.expense.findMany.mockResolvedValue([]);

      await listExpenses(prisma, 'user-1', { first: 9999 });

      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 101 }), // MAX_PAGE_SIZE (100) + 1 lookahead row
      );
    });

    it('reports hasNextPage: true only when more rows exist than requested', async () => {
      const rows = Array.from({ length: 6 }, (_, i) => buildTestExpense({ id: `exp-${i}` }));
      prisma.expense.findMany.mockResolvedValue(rows); // 6 returned for a `first: 5` request

      const result = await listExpenses(prisma, 'user-1', { first: 5 });

      expect(result.items).toHaveLength(5);
      expect(result.hasNextPage).toBe(true);
      expect(result.endCursor).toBe('exp-4');
    });
  });
});
