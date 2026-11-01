// Adds the 20 sample casts to an existing database without wiping anything.
// Usage: npm run db:sample-casts
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { tokyoToday } from '../src/common/tokyo-time.js';
import { addSampleCasts } from './sample-casts.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

addSampleCasts(prisma, tokyoToday())
  .then((n) => console.log(`Added ${n} sample casts (existing ones skipped).`))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
