import { NotFoundError } from '@/errors/AppError';

/**
 * Shared ownership-check helper used by every resource module
 * (categories, expenses, ...). Given a resource that may or may not
 * exist, and the id of the user making the request, returns the
 * resource if — and only if — it exists AND belongs to that user.
 */
export function assertOwnership<T extends { userId: string }>(
  resource: T | null,
  userId: string,
  resourceName: string,
): T {
  if (!resource || resource.userId !== userId) {
    throw new NotFoundError(`${resourceName} not found.`);
  }
  return resource;
}
