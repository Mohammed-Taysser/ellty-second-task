import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Operation, OPERATION_TYPE } from '@prisma';
import { hashSync } from 'bcrypt';

import CONFIG from '@/apps/config';
import prisma from '@/apps/prisma';
import { calculateOperation } from '@/modules/operation/operation.service';

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

function getSeedMultiplier() {
  const countFlagIndex = process.argv.findIndex((arg) => arg === '--count');
  const rawValue =
    (countFlagIndex > -1 ? process.argv[countFlagIndex + 1] : undefined) ??
    process.argv.find((arg) => arg.startsWith('--count='))?.split('=')[1] ??
    process.env.SEED_COUNT;

  if (!rawValue) {
    return 1;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function withEmailSuffix(email: string, suffix: string) {
  const atIndex = email.lastIndexOf('@');
  if (atIndex <= 0) {
    return `${email}+seed${suffix}`;
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  return `${local}+seed${suffix}@${domain}`;
}

function expandSeedData(seedData: SeedData, multiplier: number): SeedData {
  if (multiplier <= 1) {
    return seedData;
  }

  const users: SeedData['users'] = [];
  const discussions: SeedData['discussions'] = [];
  const operations: SeedData['operations'] = [];

  const userBaseCount = seedData.users.length;
  const discussionBaseCount = seedData.discussions.length;
  const operationBaseCount = seedData.operations.length;

  for (let index = 0; index < multiplier; index += 1) {
    const isBase = index === 0;
    const userOffset = index * userBaseCount;
    const discussionOffset = index * discussionBaseCount;
    const operationOffset = index * operationBaseCount;
    const suffix = String(index + 1);

    seedData.users.forEach((user) => {
      users.push({
        name: isBase ? user.name : `${user.name} ${suffix}`,
        email: isBase ? user.email : withEmailSuffix(user.email, suffix),
      });
    });

    seedData.discussions.forEach((discussion) => {
      discussions.push({
        title: isBase || !discussion.title ? discussion.title : `${discussion.title} #${suffix}`,
        startingValue: discussion.startingValue,
        createdByIndex: discussion.createdByIndex + userOffset,
      });
    });

    seedData.operations.forEach((operation) => {
      operations.push({
        discussionIndex: operation.discussionIndex + discussionOffset,
        parentOperationIndex:
          operation.parentOperationIndex === null
            ? null
            : operation.parentOperationIndex + operationOffset,
        operationType: operation.operationType,
        value: operation.value,
        totals: operation.totals,
        createdByIndex: operation.createdByIndex + userOffset,
      });
    });
  }

  return { users, discussions, operations };
}

/**
 * Seed script to populate database with demo data
 * - Reads data from seed-data.json
 * - Creates demo users with secure passwords from env
 * - Creates discussions and operations from JSON data
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  // Load seed data from JSON
  const seedDataPath = join(__dirname, 'seed-data.json');
  const seedData: SeedData = JSON.parse(readFileSync(seedDataPath, 'utf-8'));
  const seedMultiplier = getSeedMultiplier();
  const expandedSeedData = expandSeedData(seedData, seedMultiplier);

  console.log('✅ Loaded seed data from JSON\n');
  if (seedMultiplier > 1) {
    console.log(`📈 Seed multiplier set to ${seedMultiplier}`);
    console.log(
      `   - Users: ${expandedSeedData.users.length}\n   - Discussions: ${expandedSeedData.discussions.length}\n   - Operations: ${expandedSeedData.operations.length}\n`
    );
  }

  // Hash the seed password from config
  const hashedPassword = hashSync(CONFIG.SEED_USER_PASSWORD, 10);

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.operation.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleaned\n');

  // Create demo users
  console.log('👥 Creating demo users...');
  await prisma.user.createMany({
    data: expandedSeedData.users.map((userData) => ({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
    })),
  });

  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' },
    take: expandedSeedData.users.length,
  });

  console.log('✅ Created', users.length, 'users\n');

  // Create discussions
  console.log('💬 Creating discussions...');
  const discussionSeed = expandedSeedData.discussions.map((discussionData) => ({
    title: discussionData.title,
    startingValue: discussionData.startingValue,
    createdBy: users[discussionData.createdByIndex].id,
  }));

  await prisma.discussion.createMany({
    data: discussionSeed,
  });

  const discussions = await prisma.discussion.findMany({
    orderBy: { id: 'asc' },
    take: discussionSeed.length,
  });

  console.log('✅ Created', discussions.length, 'discussions\n');

  // Create operations
  console.log('🔢 Creating operations...');
  const operations: Operation[] = [];

  for (const operationData of expandedSeedData.operations) {
    // Calculate beforeValue from parent or starting value
    let beforeValue: number;
    if (operationData.parentOperationIndex === null) {
      // Root operation: beforeValue is the discussion's starting value
      beforeValue = discussions[operationData.discussionIndex].startingValue;
    } else {
      // Child operation: beforeValue is parent's afterValue
      beforeValue = operations[operationData.parentOperationIndex].afterValue;
    }

    // Calculate afterValue based on operation type
    // Calculate afterValue using shared service logic
    const afterValue = calculateOperation(
      beforeValue,
      operationData.operationType,
      operationData.value
    );

    const operation = await prisma.operation.create({
      data: {
        discussionId: discussions[operationData.discussionIndex].id,
        parentId:
          operationData.parentOperationIndex === null
            ? null
            : operations[operationData.parentOperationIndex].id,
        title: `${operationData.operationType} ${operationData.value}`,
        operationType: OPERATION_TYPE[operationData.operationType],
        value: operationData.value,
        beforeValue,
        afterValue,
        createdBy: users[operationData.createdByIndex].id,
      },
    });
    operations.push(operation);
  }

  console.log('✅ Created', operations.length, 'operations\n');

  console.log('✨ Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   - Users:', users.length);
  console.log('   - Discussions:', discussions.length);
  console.log('   - Operations:', operations.length);
  console.log(`\n🔐 Demo user credentials:`);
  console.log(`   Email: ${users[0].email} (or any demo user)`);
  console.log('   Password:', CONFIG.SEED_USER_PASSWORD);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
