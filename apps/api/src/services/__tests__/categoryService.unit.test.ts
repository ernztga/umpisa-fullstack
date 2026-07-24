import { mockDeep, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient, Category } from '@prisma/client';
import { createCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { ConflictError, NotFoundError } from '@/errors/AppError';

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

describe('categoryService', () => {
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
  });

  describe('createCategory', () => {
    it('throws ConflictError if a category with the same name already exists for the user', async () => {
      prisma.category.findUnique.mockResolvedValue(buildTestCategory());

      await expect(
        createCategory(prisma, 'user-1', { name: 'Food', color: '#F59E0B' }),
      ).rejects.toThrow(ConflictError);
    });

    it('creates the category when no name collision exists', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(buildTestCategory({ name: 'Travel' }));

      const result = await createCategory(prisma, 'user-1', { name: 'Travel', color: '#14B8A6' });

      expect(result.name).toBe('Travel');
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { name: 'Travel', color: '#14B8A6', userId: 'user-1' },
      });
    });
  });

  describe('updateCategory (ownership enforcement)', () => {
    it('throws NotFoundError when the category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        updateCategory(prisma, 'user-1', 'nonexistent-id', { color: '#000000' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when the category belongs to a DIFFERENT user', async () => {
      // Fetching a real category that belongs to someone else must fail identically to it not existing at all
      prisma.category.findUnique.mockResolvedValue(buildTestCategory({ userId: 'someone-else' }));

      await expect(updateCategory(prisma, 'user-1', 'cat-1', { color: '#000000' })).rejects.toThrow(
        'Category not found.',
      );

      expect(prisma.category.update).not.toHaveBeenCalled();
    });

    it('allows the owner to update their own category', async () => {
      prisma.category.findUnique
        .mockResolvedValueOnce(buildTestCategory()) // ownership lookup
        .mockResolvedValueOnce(null); // name-collision check (renaming)
      prisma.category.update.mockResolvedValue(buildTestCategory({ name: 'Groceries' }));

      const result = await updateCategory(prisma, 'user-1', 'cat-1', { name: 'Groceries' });

      expect(result.name).toBe('Groceries');
    });
  });

  describe('deleteCategory (ownership enforcement)', () => {
    it('refuses to delete a category owned by a different user', async () => {
      prisma.category.findUnique.mockResolvedValue(buildTestCategory({ userId: 'someone-else' }));

      await expect(deleteCategory(prisma, 'user-1', 'cat-1')).rejects.toThrow(NotFoundError);
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });
  });
});
