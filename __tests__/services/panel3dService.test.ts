import { describe, it, expect, jest } from '@jest/globals';
import { panel3dService } from '@/services/admin/panel3dService';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    panel3D: {
      findUnique: jest.fn(),
    },
    mountingHardwareRelation: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    workRelation: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe('Panel3dService - Related Nomenclature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('getMountingHardware', () => {
    it('should include relations when loading mounting hardware', async () => {
      const mockPanel = {
        id: 'panel3d1',
        name: 'Test Panel',
      };

      const mockRelations = [
        {
          id: 'rel1',
          mountingHardwareId: 'hw1',
          referenceType: 'PANEL_3D',
          referenceId: 'panel3d1',
          createdAt: new Date(),
          mountingHardware: {
            id: 'hw1',
            name: 'Test Hardware',
            retailPrice: 100,
            active: true,
          },
        },
      ];

      (prisma.panel3D.findUnique as jest.Mock).mockResolvedValue(mockPanel);
      (prisma.mountingHardwareRelation.findMany as jest.Mock).mockResolvedValue(mockRelations as any);

      const result = await panel3dService.getMountingHardware('panel3d1');

      expect(prisma.mountingHardwareRelation.findMany).toHaveBeenCalledWith({
        where: {
          referenceType: 'PANEL_3D',
          referenceId: 'panel3d1',
          mountingHardware: { active: true },
        },
        include: {
          mountingHardware: true,
        },
        orderBy: {
          mountingHardware: { sortOrder: 'asc' },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('hw1');
      expect(result[0].name).toBe('Test Hardware');
    });
  });

  describe('getWorks', () => {
    it('should include relations when loading works', async () => {
      const mockPanel = {
        id: 'panel3d1',
        name: 'Test Panel',
      };

      const mockRelations = [
        {
          id: 'rel1',
          workId: 'work1',
          referenceType: 'PANEL_3D',
          referenceId: 'panel3d1',
          createdAt: new Date(),
          work: {
            id: 'work1',
            name: 'Test Work',
            price: 1000,
            active: true,
          },
        },
      ];

      (prisma.panel3D.findUnique as jest.Mock).mockResolvedValue(mockPanel);
      (prisma.workRelation.findMany as jest.Mock).mockResolvedValue(mockRelations as any);

      const result = await panel3dService.getWorks('panel3d1');

      expect(prisma.workRelation.findMany).toHaveBeenCalledWith({
        where: {
          referenceType: 'PANEL_3D',
          referenceId: 'panel3d1',
          work: { active: true },
        },
        include: {
          work: true,
        },
        orderBy: {
          work: { sortOrder: 'asc' },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('work1');
      expect(result[0].name).toBe('Test Work');
    });
  });
});
