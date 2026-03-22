import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DEFAULT_COST = 10;

function isHashed(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, DEFAULT_COST);
}

async function main() {
  console.log('Starting password migration...');

  const users = await prisma.user.findMany({
    select: { id: true, email: true, password: true },
  });

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    if (isHashed(user.password)) {
      console.log(`[SKIP] ${user.email} - already hashed`);
      skipped++;
      continue;
    }

    const hashedPassword = await hashPassword(user.password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log(`[MIGRATED] ${user.email}`);
    migrated++;
  }

  console.log(`\nMigration complete:`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Total: ${users.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
