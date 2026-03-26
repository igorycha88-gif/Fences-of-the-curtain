import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { calculateMountingHardware } from '@/services/calculator/mountingHardwareCalculator';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    mountingHardware: {
      findMany: jest.fn(),
    },
    mountingHardwareRelation: {
      findMany: jest.fn(),
    },
  },
}));

describe('MountingHardwareCalculator - Panel3D Relations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should include relations when loading mounting hardware', async () => {
    const mockHardware = [
      {
        id: 'hw1',
        name: 'Саморезы',
        active: true,
        useInCalculator: true,
        retailPrice: 10,
        calculationMethod: 'BY_QUANTITY',
        calculationValue: 1,
        sortOrder: 1,
      },
    ];

    const mockRelations = [
      {
        id: 'rel1',
        mountingHardwareId: 'hw1',
        referenceType: 'PANEL_3D',
        referenceId: 'panel3d1',
        createdAt: new Date(),
      },
    ];

    (prisma.mountingHardware.findMany as any).mockResolvedValue(mockHardware);
    (prisma.mountingHardwareRelation.findMany as any).mockResolvedValue(mockRelations);

    const result = await calculateMountingHardware({
      fenceLengthM: 10,
      fenceHeightM: 2,
      postsCount: 5,
      lagsCount: 10,
      panel3dId: 'panel3d1',
      panel3dCount: 4,
    });

    expect(prisma.mountingHardware.findMany).toHaveBeenCalledWith({
      where: {
        active: true,
        useInCalculator: true,
      },
      include: {
        relations: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    expect(result.length).toBeGreaterThan(0);
  });
});
