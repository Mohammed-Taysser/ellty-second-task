import { defineConfig } from 'prisma/config';

import CONFIG from './src/apps/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --require tsconfig-paths/register prisma/seed.ts',
  },
  datasource: {
    url: CONFIG.DATABASE_URL,
  },
});
