import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { workService } from '@/services/admin/workService';
import { prisma } from '@/lib/prisma';
import { Work, WorkRelation } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    work: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('WorkService - getWorksForCalculatorByReference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should include relations when loading works for reference', async () => {
    const mockRelations: WorkRelation[] = [
      {
        id: 'rel1',
        workId: 'work1',
        referenceType: 'PANEL_3D',
        referenceId: 'panel3d1',
        fenceType: null,
        createdAt: new Date(),
      },
    ];

    const mockWorks: (Work & { relations: WorkRelation[] })[] = [
      {
        id: 'work1',
        name: 'Монтаж 3Д',
        active: true,
        useInCalculator: true,
        sortOrder: 1,
        category: 'INSTALLATION',
        unit: 'шт',
        price: 1000,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        relations: mockRelations,
      },
    ];

    (prisma.work.findMany as jest.Mock).mockResolvedValue(mockWorks as any);

    const result = await workService.getWorksForCalculatorByReference('PANEL_3D', 'panel3d1');

    expect(prisma.work.findMany).toHaveBeenCalledWith({
      where: {
        active: true,
        useInCalculator: true,
      },
      include: {
        relations: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('work1');
    expect(result[0].name).toBe('Монтаж 3Д');
  });

  it('should filter works by referenceType and referenceId', async () => {
    const mockWorks: (Work & { relations: WorkRelation[] })[] = [
      {
        id: 'work1',
        name: 'Монтаж 3Д',
        active: true,
        useInCalculator: true,
        sortOrder: 1,
        category: 'INSTALLATION',
        unit: 'шт',
        price: 1000,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        relations: [
          {
            id: 'rel1',
            workId: 'work1',
            referenceType: 'PANEL_3D',
            referenceId: 'panel3d1',
            fenceType: null,
            createdAt: new Date(),
          },
        ],
      },
      {
        id: 'work2',
        name: 'Монтаж ворот',
        active: true,
        useInCalculator: true,
        sortOrder: 2,
        category: 'INSTALLATION',
        unit: 'шт',
        price: 2000,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        relations: [
          {
            id: 'rel2',
            workId: 'work2',
            referenceType: 'GATE',
            referenceId: 'gate1',
            fenceType: null,
            createdAt: new Date(),
          },
        ],
      },
    ];

    (prisma.work.findMany as jest.Mock).mockResolvedValue(mockWorks as any);

    const result = await workService.getWorksForCalculatorByReference('PANEL_3D', 'panel3d1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('work1');
    expect(result[0].name).toBe('Монтаж 3Д');
  });

  it('should return empty array if no works found for reference', async () => {
    const mockWorks: (Work & { relations: WorkRelation[] })[] = [
      {
        id: 'work1',
        name: 'Монтаж ворот',
        active: true,
        useInCalculator: true,
        sortOrder: 1,
        category: 'INSTALLATION',
        unit: 'шт',
        price: 2000,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        relations: [
          {
            id: 'rel1',
            workId: 'work1',
            referenceType: 'GATE',
            referenceId: 'gate1',
            fenceType: null,
            createdAt: new Date(),
          },
        ],
      },
    ];

    (prisma.work.findMany as jest.Mock).mockResolvedValue(mockWorks as any);

    const result = await workService.getWorksForCalculatorByReference('PANEL_3D', 'panel3d1');

    expect(result).toHaveLength(0);
  });

  it('should return empty array for work without relations', async () => {
    const mockWorks: (Work & { relations: WorkRelation[] })[] = [
      {
        id: 'work1',
        name: 'Монтаж 3Д',
        active: true,
        useInCalculator: true,
        sortOrder: 1,
        category: 'INSTALLATION',
        unit: 'шт',
        price: 1000,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        relations: [],
      },
    ];

    (prisma.work.findMany as jest.Mock).mockResolvedValue(mockWorks as any);

    const result = await workService.getWorksForCalculatorByReference('PANEL_3D', 'panel3d1');

    expect(result).toHaveLength(0);
  });
});
