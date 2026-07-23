import { NotFoundError } from '@/errors/AppError';

/**
 * Shared ownership-check helper used by every resource module
 * (categories, expenses, ...). Given a resource that may or may not
 * exist, and the id of the user making the request, returns the
 * resource if — and only if — it exists AND belongs to that user.
 *
 * Deliberately throws the SAME NotFoundError whether the resource
 * doesn't exist at all, or exists but belongs to someone else — this
 * avoids leaking which case occurred to the caller (see architectural
 * decision 2.3: never let a 403 reveal that a resource exists).
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