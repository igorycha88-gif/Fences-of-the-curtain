import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:dummy@localhost:5432/fences',
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function disconnectPrisma() {
  if (process.env.NODE_ENV !== 'production') {
    await prisma.$disconnect();
  }
}
