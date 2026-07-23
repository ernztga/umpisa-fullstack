import type { Category, PrismaClient } from '@prisma/client';
import { ConflictError } from '@/errors/AppError';
import { assertOwnership } from '@/utils/ownership';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/validation/categorySchemas';

/**
 * Returns all categories belonging to the given user, alphabetically
 * ordered — a sensible, predictable default order for a dropdown/list
 * UI rather than relying on insertion order.
 */
export function listCategories(prisma: PrismaClient, userId: string): Promise<Category[]> {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
}

/**
 * Creates a new category for the user. Relies on the DB-level
 * @@unique([userId, name]) constraint (Step 1 schema) as the ultimate
 * source of truth for uniqueness, but pre-checks here first to return
 * a clean ConflictError instead of surfacing a raw Prisma constraint
 * violation error to the caller.
 */
export async function createCategory(
  prisma: PrismaClient,
  userId: string,
  input: CreateCategoryInput,
): Promise<Category> {
  const existing = await prisma.category.findUnique({
    where: { userId_name: { userId, name: input.name } },
  });
  if (existing) {
    throw new ConflictError(`A category named "${input.name}" already exists.`);
  }

  return prisma.category.create({
    data: { name: input.name, color: input.color, userId },
  });
}

/**
 * Updates a category, enforcing ownership first. If the name is being
 * changed, also re-checks the uniqueness constraint scoped to this
 * user (a rename could collide with another existing category).
 */
export async function updateCategory(
  prisma: PrismaClient,
  userId: string,
  categoryId: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  const category = assertOwnership(existing, userId, 'Category');

  if (input.name && input.name !== category.name) {
    const nameCollision = await prisma.category.findUnique({
      where: { userId_name: { userId, name: input.name } },
    });
    if (nameCollision) {
      throw new ConflictError(`A category named "${input.name}" already exists.`);
    }
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
    },
  });
}

/**
 * Deletes a category after enforcing ownership. Any expenses referencing
 * this category will have their categoryId set to null automatically
 * (onDelete: SetNull, defined in the Prisma schema, Step 1) — financial
 * records are never destroyed as a side effect of deleting a category.
 */
export async function deleteCategory(
  prisma: PrismaClient,
  userId: string,
  categoryId: string,
): Promise<Category> {
  const existing = await prisma.category.findUnique({ where: { id: categoryId } });
  const category = assertOwnership(existing, userId, 'Category');

  return prisma.category.delete({ where: { id: category.id } });
}
