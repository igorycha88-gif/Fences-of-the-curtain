import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    work: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    workRelation: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    referenceChangeLog: {
      create: jest.fn(),
    },
  },
}));

describe('Works API placeholder', () => {
  it('should pass placeholder test', () => {
    expect(true).toBe(true);
  });
});
