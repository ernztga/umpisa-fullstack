import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Default categories created for every new user at registration time
 */
export const DEFAULT_CATEGORIES: ReadonlyArray<{ name: string; color: string }> = [
  { name: 'Food', color: '#F59E0B' },
  { name: 'Transport', color: '#3B82F6' },
  { name: 'Utilities', color: '#10B981' },
  { name: 'Entertainment', color: '#EC4899' },
  { name: 'Other', color: '#6B7280' },
];

/**
 * Standalone dev-seed entrypoint. Not used in production (for testing only)
 */
async function main(): Promise<void> {
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      // Placeholder only — actual registration always hashes via bcrypt
      // Equivalent to "Demo1234!" for local testing
      passwordHash: '$2b$10$K7QwZ8m1c2s5eY0k6z0j9uL3nR8vQe4tY6bN2xW1pS9dR7fH0iC2q',
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: { userId_name: { userId: demoUser.id, name: category.name } },
        update: {},
        create: { ...category, userId: demoUser.id },
      }),
    ),
  );

  console.log(`Seeded demo user: ${demoUser.email}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
