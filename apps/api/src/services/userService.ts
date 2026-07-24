import type { PrismaClient, User } from '@prisma/client';
import type { UpdateProfileInput } from '@/validation/userSchemas';
import { toPublicUser, type PublicUser } from '@/services/authService';

/**
 * Updates a user's account-level preferences (currently just
 * preferredCurrency).
 */
export async function updateUserProfile(
  prisma: PrismaClient,
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const user: User = await prisma.user.update({
    where: { id: userId },
    data: { preferredCurrency: input.preferredCurrency },
  });
  return toPublicUser(user);
}
