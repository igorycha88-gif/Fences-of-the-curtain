import { prisma as prismaClient } from '../../prisma.config';

const globalForPrisma = globalThis as unknown as {
  prisma: typeof prismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
