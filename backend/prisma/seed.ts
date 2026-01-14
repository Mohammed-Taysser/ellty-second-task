import fs from 'node:fs';
import { join } from 'node:path';

import { faker } from '@faker-js/faker';
import { OPERATION_TYPE, Prisma } from '@prisma';
import { hashSync } from 'bcrypt';
import { Command } from 'commander';

import CONFIG from '@/apps/config';
import prisma from '@/apps/prisma';

const DEFAULT_SEED_FILE_PATH = join(__dirname, 'seed-data.json');

interface SeedData {
  users: Array<{ name: string; email: string }>;
  discussions: Array<{ title: string; startingValue: number; createdByIndex: number }>;
  operations: Array<{
    discussionIndex: number;
    parentOperationIndex: number | null;
    operationType: keyof typeof OPERATION_TYPE;
    value: number;
    totals: number;
    createdByIndex: number;
  }>;
}

interface SeedContext {
  batchSize: number;
  usersCount: number;
  discussionsCount: number;
  operationsCount: number;
  sampleMode: boolean;
  cleanMode: boolean;
  analytics: boolean;
  startTime: number;
  file: string;
  password: string;
}

function buildCLI() {
  const program = new Command();

  const helpText = [
    '',
    'Examples (single option):',
    '  prisma-seed --sample                         Use sample data from file.',
    '  prisma-seed --clean                          Clear tables before seeding.',
    '  prisma-seed --users 500                      Generate 500 random users.',
    '  prisma-seed --discussions 1000               Generate 1,000 discussions.',
    '  prisma-seed --operations 20000               Generate 20,000 operations.',
    '  prisma-seed --batchSize 5000                 Insert in batches of 5,000.',
    '  prisma-seed --password "Demo@123456"         Use a custom user password.',
    '  prisma-seed --analytics                      Print timing + memory stats.',
    '  prisma-seed --file prisma/seed-data.json --sample  Use a custom sample file.',
    '',
    'Examples:',
    '  prisma-seed --sample --clean                 Sample data with a clean start.',
    '  prisma-seed --users 1000 --discussions 2000 --operations 10000',
    '                                                Larger random dataset.',
    '  prisma-seed --batchSize 5000 --analytics      Bigger batches with analytics.',
    '  prisma-seed --sample --file prisma/seed-data.json --clean --analytics',
    '                                                Sample file + clean + metrics.',
    '  prisma-seed --users 5000 --operations 20000 --batchSize 2000 --analytics',
    '                                                Heavy run with metrics.',
    '',
    'Notes:',
    `  - --sample reads from --file (default: ${DEFAULT_SEED_FILE_PATH}).`,
    '  - All count options accept integers >= 0.',
    '  - --batchSize must be >= 1.',
    '  - If running using script, you may add extra -- before passing options.',
    '    example: yarn prisma:seed -- -- --users 5000 --clean',
  ].join('\n');

  program
    .name('prisma-seed')
    .description('High-performance Prisma seed runner')
    .option('--sample', 'Seed only from JSON sample file')
    .option('--clean', 'Clean database before seeding')
    .option('-u, --users <number>', 'Number of users to generate in random mode (>= 0).', '100')
    .option(
      '-d, --discussions <number>',
      'Number of discussions to generate in random mode (>= 0).',
      '100'
    )
    .option(
      '-o, --operations <number>',
      'Number of operations to generate in random mode (>= 0).',
      '100'
    )
    .option('-b, --batchSize <number>', 'Insert batch size for createMany (>= 1).', '1000')
    .option(
      '--password <string>',
      'Password used for seeded users (hashed before insert).',
      CONFIG.SEED_USER_PASSWORD
    )
    .option('--analytics', 'Print timing + memory usage at the end.')
    .option(
      '--file <path>',
      'Path to sample JSON file when --sample is set.',
      DEFAULT_SEED_FILE_PATH
    )
    .addHelpText('after', helpText)
    .parse(process.argv);

  const opts = program.opts();
  const users = Number(opts.users);
  const discussions = Number(opts.discussions);
  const operations = Number(opts.operations);
  const batchSize = Number(opts.batchSize);

  if ([users, discussions, operations].some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error('users, discussions, and operations must be numbers >= 0');
  }

  if (!Number.isFinite(batchSize) || batchSize < 1) {
    throw new Error('batchSize must be a number >= 1');
  }

  return {
    sample: Boolean(opts.sample),
    clean: Boolean(opts.clean),
    analytics: Boolean(opts.analytics),
    file: opts.file,
    users,
    discussions,
    operations,
    batchSize,
    password: opts.password,
  };
}

async function cleanDatabase() {
  console.log('🧹 Cleaning database...\n');

  await prisma.$transaction([
    prisma.operation.deleteMany(),
    prisma.discussion.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('✅ Database cleaned\n');
}

async function batchInsert<T>(
  label: string,
  total: number,
  batchSize: number,
  factory: (skip: number, take: number) => Promise<T[]>,
  insert: (rows: T[]) => Promise<unknown>
) {
  let inserted = 0;
  let batch = 0;

  while (inserted < total) {
    const take = Math.min(batchSize, total - inserted);

    const rows = await factory(inserted, take);
    await insert(rows);

    inserted += take;
    batch++;

    const percent = ((inserted / total) * 100).toFixed(1);
    process.stdout.write(
      `\r⚙️  ${label} | batch: ${batch} | inserted: ${inserted}/${total} (${percent}%)`
    );
  }

  console.log(`\n✅ ${label} completed\n`);
}

function buildUsers(count: number, password: string): Prisma.UserCreateManyInput[] {
  return Array.from({ length: count }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email({
      lastName: `${faker.person.lastName()}_${faker.date.past().getTime()}`,
    }),
    createdAt: faker.date.recent({ days: 30 }),
    password,
  }));
}

function buildDiscussions(
  count: number,
  userIds: { id: number }[]
): Prisma.DiscussionCreateManyInput[] {
  return Array.from({ length: count }).map(() => ({
    title: faker.lorem.sentence(),
    startingValue: faker.number.int({ min: 1, max: 1000 }),
    createdBy: faker.helpers.arrayElement(userIds).id,
    createdAt: faker.date.recent({ days: 20 }),
  }));
}

function buildOperations(
  count: number,
  discussionIds: { id: number }[],
  userIds: { id: number }[]
): Prisma.OperationCreateManyInput[] {
  return Array.from({ length: count }).map(() => ({
    discussionId: faker.helpers.arrayElement(discussionIds).id,
    operationType: faker.helpers.enumValue(OPERATION_TYPE),
    value: faker.number.int({ min: -100, max: 300 }),
    createdBy: faker.helpers.arrayElement(userIds).id,
    createdAt: faker.date.recent({ days: 10 }),
  }));
}

function loadSampleSeed(path: string): SeedData {
  const seedDataPath = path;

  if (!fs.existsSync(seedDataPath)) {
    throw new Error('Sample file not found');
  }
  return JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));
}

async function seedSampleMode(context: SeedContext, data: SeedData) {
  console.log('📦 Sample mode enabled\n');

  console.log('👥 Creating demo users...\n');

  // Validate if any of sample data mail already in use
  const emails = data.users.map((user) => user.email);
  const existingUsers = await prisma.user.findMany({ where: { email: { in: emails } } });
  if (existingUsers.length > 0) {
    throw new Error(
      `Sample data contains users with email already in use: ${existingUsers
        .map((user) => user.email)
        .join(', ')}`
    );
  }

  await prisma.user.createMany({
    data: data.users.map((user) => ({
      name: user.name,
      email: user.email,
      password: context.password,
    })),
  });

  const usersDB = await prisma.user.findMany({ select: { id: true } });

  console.log('✅ Created', usersDB.length, 'users\n');

  console.log('💬 Creating discussions...\n');

  await prisma.discussion.createMany({
    data: data.discussions.map((discuss) => {
      const user = usersDB[discuss.createdByIndex];

      return {
        title: discuss.title,
        startingValue: discuss.startingValue,
        createdBy: user.id,
      };
    }),
  });

  const discussionsDB = await prisma.discussion.findMany({
    select: { id: true, startingValue: true },
  });

  console.log('✅ Created', discussionsDB.length, 'discussions\n');

  // Create operations
  console.log('🔢 Creating operations...\n');

  await prisma.operation.createMany({
    data: data.operations.map((operation) => ({
      discussionId: discussionsDB[operation.discussionIndex].id,
      parentId: null,
      title: `${operation.operationType} ${operation.value}`,
      operationType: OPERATION_TYPE[operation.operationType],
      value: operation.value,
      createdBy: usersDB[operation.createdByIndex].id,
    })),
  });

  const operationsDB = await prisma.operation.findMany({ select: { id: true } });

  console.log('✅ Created', operationsDB.length, 'operations\n');
}

async function seedRandomMode(context: SeedContext) {
  console.log('🎲 Random data mode\n');

  await batchInsert(
    'Users',
    context.usersCount,
    context.batchSize,
    async (_, take) => buildUsers(take, context.password),
    async (rows) => prisma.user.createMany({ data: rows })
  );

  const userIds = await prisma.user.findMany({ select: { id: true } });

  await batchInsert(
    'Discussions',
    context.discussionsCount,
    context.batchSize,
    async (_, take) => buildDiscussions(take, userIds),
    async (rows) => prisma.discussion.createMany({ data: rows })
  );

  const discussionIds = await prisma.discussion.findMany({ select: { id: true } });

  await batchInsert(
    'Operations',
    context.operationsCount,
    context.batchSize,
    async (_, take) => buildOperations(take, discussionIds, userIds),
    async (rows) => prisma.operation.createMany({ data: rows })
  );
}

async function main() {
  const args = buildCLI();

  // Hash the seed password from config
  const hashedPassword = hashSync(args.password, 10);

  const context: SeedContext = {
    batchSize: args.batchSize,
    usersCount: args.users || 100,
    discussionsCount: args.discussions || 100,
    operationsCount: args.operations || 100,
    sampleMode: args.sample,
    analytics: args.analytics,
    startTime: Date.now(),
    file: args.file,
    password: hashedPassword,
    cleanMode: args.clean,
  };

  console.log('🌱 Prisma Seed Runner\n');

  if (context.cleanMode) {
    await cleanDatabase();
  }

  const SAMPLE_DATA = loadSampleSeed(context.file);

  if (context.sampleMode) {
    await seedSampleMode(context, SAMPLE_DATA);
  } else {
    await seedRandomMode(context);
  }

  const firstUser = await prisma.user.findFirst();

  const createdResources = {
    users: context.sampleMode ? SAMPLE_DATA.users.length : context.usersCount,
    discussions: context.sampleMode ? SAMPLE_DATA.discussions.length : context.discussionsCount,
    operations: context.sampleMode ? SAMPLE_DATA.operations.length : context.operationsCount,
  };

  console.log('\n✨ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Users:', createdResources.users);
  console.log('   - Discussions:', createdResources.discussions);
  console.log('   - Operations:', createdResources.operations);

  console.log(`\n🔐 Demo user credentials:`);
  console.log(`   Email: ${firstUser?.email ?? 'N/A'} (or any demo user)`);
  console.log('   Password:', args.password);

  if (context.analytics) {
    const mem = process.memoryUsage();
    console.log('\n📈 Analytics:');
    console.log('   - Time:', ((Date.now() - context.startTime) / 1000).toFixed(2), 's');
    console.log('   - RSS:', (mem.rss / 1024 / 1024).toFixed(1), 'MB');
    console.log('   - Heap:', (mem.heapUsed / 1024 / 1024).toFixed(1), 'MB');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
