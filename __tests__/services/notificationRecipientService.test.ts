import { notificationRecipientService } from '@/services/admin/notificationRecipientService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    notificationRecipient: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('NotificationRecipientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecipients', () => {
    it('should return recipients with pagination', async () => {
      const mockRecipients = [
        { id: '1', email: 'admin@example.com', name: 'Admin', active: true, createdAt: new Date() },
      ];
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findMany.mockResolvedValue(mockRecipients);
      prisma.notificationRecipient.count.mockResolvedValue(1);

      const result = await notificationRecipientService.getRecipients({ page: 1, pageSize: 20 });

      expect(result.recipients).toHaveLength(1);
      expect(result.recipients[0].email).toBe('admin@example.com');
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findMany.mockResolvedValue([]);
      prisma.notificationRecipient.count.mockResolvedValue(0);

      await notificationRecipientService.getRecipients({ active: true });

      expect(prisma.notificationRecipient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
        })
      );
    });

    it('should search by email and name', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findMany.mockResolvedValue([]);
      prisma.notificationRecipient.count.mockResolvedValue(0);

      await notificationRecipientService.getRecipients({ search: 'admin' });

      expect(prisma.notificationRecipient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { email: { contains: 'admin', mode: 'insensitive' } },
              { name: { contains: 'admin', mode: 'insensitive' } },
            ],
          },
        })
      );
    });
  });

  describe('getActiveRecipients', () => {
    it('should return only active recipients', async () => {
      const mockRecipients = [
        { id: '1', email: 'active@example.com', active: true },
      ];
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findMany.mockResolvedValue(mockRecipients);

      const result = await notificationRecipientService.getActiveRecipients();

      expect(result).toHaveLength(1);
      expect(prisma.notificationRecipient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true },
          orderBy: { createdAt: 'asc' },
        })
      );
    });
  });

  describe('createRecipient', () => {
    it('should create recipient with valid data', async () => {
      const mockRecipient = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.create.mockResolvedValue(mockRecipient);

      const result = await notificationRecipientService.createRecipient({
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User',
      });

      expect(result).toEqual(mockRecipient);
      expect(prisma.notificationRecipient.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          active: true,
        },
      });
    });

    it('should default active to true', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.create.mockResolvedValue({ id: '1', active: true });

      await notificationRecipientService.createRecipient({ email: 'test@example.com' });

      expect(prisma.notificationRecipient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ active: true }),
        })
      );
    });
  });

  describe('updateRecipient', () => {
    it('should update recipient fields', async () => {
      const mockRecipient = {
        id: '1',
        email: 'updated@example.com',
        name: 'Updated',
        active: false,
      };
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.update.mockResolvedValue(mockRecipient);

      const result = await notificationRecipientService.updateRecipient('1', {
        email: 'UPDATED@EXAMPLE.COM',
        name: 'Updated',
        active: false,
      });

      expect(result).toEqual(mockRecipient);
      expect(prisma.notificationRecipient.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          email: 'updated@example.com',
          name: 'Updated',
          active: false,
        },
      });
    });
  });

  describe('deleteRecipient', () => {
    it('should delete recipient', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.delete.mockResolvedValue({ id: '1' });

      const result = await notificationRecipientService.deleteRecipient('1');

      expect(result).toEqual({ id: '1' });
      expect(prisma.notificationRecipient.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('toggleActive', () => {
    it('should toggle from true to false', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findUnique.mockResolvedValue({ active: true });
      prisma.notificationRecipient.update.mockResolvedValue({ id: '1', active: false });

      const result = await notificationRecipientService.toggleActive('1');

      expect(result.active).toBe(false);
      expect(prisma.notificationRecipient.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { active: false },
      });
    });

    it('should toggle from false to true', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findUnique.mockResolvedValue({ active: false });
      prisma.notificationRecipient.update.mockResolvedValue({ id: '1', active: true });

      const result = await notificationRecipientService.toggleActive('1');

      expect(result.active).toBe(true);
    });

    it('should throw error if recipient not found', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.notificationRecipient.findUnique.mockResolvedValue(null);

      await expect(notificationRecipientService.toggleActive('nonexistent')).rejects.toThrow(
        'Recipient not found'
      );
    });
  });
});
