import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

const EXTRA_CATEGORIES = [
  { name: 'Subscriptions', color: '#8B5CF6' },
  { name: 'Health', color: '#06B6D4' },
];

const DESCRIPTIONS = [
  'Grocery run',
  'Coffee',
  'Uber ride',
  'Electricity bill',
  'Internet bill',
  'Netflix subscription',
  'Gym membership',
  'Lunch with team',
  'Pharmacy',
  'Movie tickets',
  'Gas',
  'Parking',
  'Water bill',
  'Phone bill',
  'Haircut',
  'Book purchase',
  'Software subscription',
  'Taxi',
  'Dinner out',
  'Snacks',
  'Flight ticket',
  'Hotel booking',
  'Car maintenance',
  'Gift',
  'Donation',
];

const CURRENCIES = ['PHP', 'PHP', 'PHP', 'USD', 'USD', 'EUR', 'JPY', 'SGD'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomAmount(): string {
  // Realistic range: 20.00 to 5000.00, 2 decimal places
  const value = Math.random() * (5000 - 20) + 20;
  return value.toFixed(2);
}

function randomDateWithinLastNDays(days: number): Date {
  const now = Date.now();
  const past = now - Math.random() * days * 24 * 60 * 60 * 1000;
  return new Date(past);
}

function parseArgs(): { email: string; count: number } {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith('--email='));
  const countArg = args.find((a) => a.startsWith('--count='));

  const email = emailArg?.split('=')[1];
  if (!email) {
    console.error('Usage: npm run prisma:populate -- --email=you@example.com [--count=500]');
    process.exit(1);
  }

  const count = countArg ? parseInt(countArg.split('=')[1] ?? '500', 10) : 500;
  return { email, count };
}

async function main(): Promise<void> {
  const { email, count } = parseArgs();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email "${email}". Register this user first, then re-run.`);
    process.exit(1);
  }

  console.log(`Populating ${count} expenses for ${email} (user id: ${user.id})...`);

  await Promise.all(
    EXTRA_CATEGORIES.map((category) =>
      prisma.category.upsert({
        where: { userId_name: { userId: user.id, name: category.name } },
        update: {},
        create: { ...category, userId: user.id },
      }),
    ),
  );

  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  if (categories.length === 0) {
    console.warn('User has no categories at all — expenses will be created as uncategorized.');
  }

  const BATCH_SIZE = 500;
  const rows: Prisma.ExpenseCreateManyInput[] = [];

  for (let i = 0; i < count; i += 1) {
    const category = Math.random() < 0.15 ? null : randomFrom(categories);

    rows.push({
      id: randomUUID(),
      amount: randomAmount(),
      currency: randomFrom(CURRENCIES),
      description: randomFrom(DESCRIPTIONS),
      date: randomDateWithinLastNDays(730), // spread across ~2 years
      userId: user.id,
      categoryId: category?.id ?? null,
    });
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.expense.createMany({ data: batch });
    inserted += batch.length;
    console.log(`  ...inserted ${inserted}/${rows.length}`);
  }

  console.log(
    `Done. Created ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} ` +
      `and ${inserted} expenses for ${email}.`,
  );
}

main()
  .catch((error) => {
    console.error('Populate script failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
