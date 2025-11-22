import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import bcrypt from 'bcrypt';

import { Operation, OPERATION_TYPE } from './generated';

import CONFIG from '@/apps/config';
import prisma from '@/apps/prisma';

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

/**
 * Seed script to populate database with demo data
 * - Reads data from seed-data.json
 * - Creates demo users with secure passwords from env
 * - Creates discussions and operations from JSON data
 */
async function main() {
  console.debug('🌱 Starting database seed...\n');

  // Load seed data from JSON
  const seedDataPath = join(__dirname, 'seed-data.json');
  const seedData: SeedData = JSON.parse(readFileSync(seedDataPath, 'utf-8'));

  console.debug('✅ Loaded seed data from JSON\n');

  // Hash the seed password from config
  const hashedPassword = await bcrypt.hash(CONFIG.SEED_USER_PASSWORD, 10);

  // Clean existing data
  console.debug('🧹 Cleaning existing data...');
  await prisma.operation.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.user.deleteMany();
  console.debug('✅ Existing data cleaned\n');

  // Create demo users
  console.debug('👥 Creating demo users...');
  const users = await Promise.all(
    seedData.users.map((userData) =>
      prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        },
      })
    )
  );
  console.log('✅ Created', users.length, 'users\n');

  // Create discussions
  console.debug('💬 Creating discussions...');
  const discussions = await Promise.all(
    seedData.discussions.map((discussionData) =>
      prisma.discussion.create({
        data: {
          title: discussionData.title,
          startingValue: discussionData.startingValue,
          createdBy: users[discussionData.createdByIndex].id,
        },
      })
    )
  );
  console.log('✅ Created', discussions.length, 'discussions\n');

  // Create operations
  console.debug('🔢 Creating operations...');
  const operations: Operation[] = [];

  for (const operationData of seedData.operations) {
    const operation = await prisma.operation.create({
      data: {
        discussionId: discussions[operationData.discussionIndex].id,
        parentId:
          operationData.parentOperationIndex == null
            ? null
            : operations[operationData.parentOperationIndex].id,
        operationType: OPERATION_TYPE[operationData.operationType],
        value: operationData.value,
        totals: operationData.totals,
        createdBy: users[operationData.createdByIndex].id,
      },
    });
    operations.push(operation);
  }

  console.log('✅ Created', operations.length, 'operations\n');

  console.debug('✨ Seed completed successfully!\n');
  console.debug('📊 Summary:');
  console.log('   - Users:', users.length);
  console.log('   - Discussions:', discussions.length);
  console.log('   - Operations:', operations.length);
  console.debug(`\n🔐 Demo user credentials:`);
  console.debug(`   Email: alice@demo.com (or any demo user)`);
  console.log('   Password:', CONFIG.SEED_USER_PASSWORD);
}

main().catch((error) => {
  console.error('❌ Seed failed:');
  console.error(error);
  process.exit(1);
});
