import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { usersService } from '@/services/admin/usersService';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    userNotificationSettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/password', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_123'),
}));

describe('UsersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return users with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockUsers = [{ id: 'u-1', email: 'test@test.com', name: 'Admin', role: 'ADMIN', active: true }];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(1);

      const result = await usersService.getUsers({ page: 1, pageSize: 20 });

      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by role', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.getUsers({ role: 'ADMIN' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'ADMIN' }),
        })
      );
    });

    it('should filter by active status', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.getUsers({ active: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ active: true }),
        })
      );
    });

    it('should filter by search', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.getUsers({ search: 'admin' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { email: { contains: 'admin', mode: 'insensitive' } },
              { name: { contains: 'admin', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should select specific fields', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await usersService.getUsers({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            active: true,
            createdAt: true,
          },
        })
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockUser = { id: 'u-1', email: 'test@test.com', name: 'Admin' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.getUserById('u-1');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        select: expect.objectContaining({
          id: true,
          email: true,
        }),
      });
    });

    it('should return null for non-existent user', async () => {
      const { prisma } = require('@/lib/prisma');
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await usersService.getUserById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should hash password and create user', async () => {
      const { prisma } = require('@/lib/prisma');
      const { hash } = require('@/lib/password');
      const mockUser = { id: 'u-1', email: 'new@test.com', name: 'New User', password: 'hashed_password_123' };
      prisma.user.create.mockResolvedValue(mockUser);

      const data = {
        email: 'new@test.com',
        name: 'New User',
        password: 'plaintext',
        role: 'MANAGER',
        phone: '+79001234567',
        active: true,
      };

      const result = await usersService.createUser(data as any);

      expect(hash).toHaveBeenCalledWith('plaintext');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          password: 'hashed_password_123',
          email: 'new@test.com',
        }),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const { prisma } = require('@/lib/prisma');
      const updated = { id: 'u-1', name: 'Updated' };
      prisma.user.update.mockResolvedValue(updated);

      const result = await usersService.updateUser('u-1', { name: 'Updated' } as any);

      expect(result).toEqual(updated);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { name: 'Updated' },
      });
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const { prisma } = require('@/lib/prisma');
      const deleted = { id: 'u-1', email: 'del@test.com' };
      prisma.user.delete.mockResolvedValue(deleted);

      const result = await usersService.deleteUser('u-1');

      expect(result).toEqual(deleted);
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u-1' } });
    });
  });

  describe('updateUserPassword', () => {
    it('should hash new password and update', async () => {
      const { prisma } = require('@/lib/prisma');
      const { hash } = require('@/lib/password');
      prisma.user.update.mockResolvedValue({ id: 'u-1' });

      await usersService.updateUserPassword('u-1', 'newpassword');

      expect(hash).toHaveBeenCalledWith('newpassword');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { password: 'hashed_password_123' },
      });
    });
  });

  describe('getUserNotificationSettings', () => {
    it('should return notification settings', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockSettings = { userId: 'u-1', emailNotifications: true };
      (prisma.userNotificationSettings.findUnique as jest.Mock).mockResolvedValue(mockSettings);

      const result = await usersService.getUserNotificationSettings('u-1');

      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateUserNotificationSettings', () => {
    it('should update existing settings', async () => {
      const { prisma } = require('@/lib/prisma');
      const existing = { userId: 'u-1', emailNotifications: true };
      const updated = { userId: 'u-1', emailNotifications: false };
      (prisma.userNotificationSettings.findUnique as jest.Mock).mockResolvedValue(existing);
      (prisma.userNotificationSettings.update as jest.Mock).mockResolvedValue(updated);

      const result = await usersService.updateUserNotificationSettings('u-1', { emailNotifications: false });

      expect(prisma.userNotificationSettings.update).toHaveBeenCalledWith({
        where: { userId: 'u-1' },
        data: { emailNotifications: false },
      });
      expect(result).toEqual(updated);
    });

    it('should create settings when none exist', async () => {
      const { prisma } = require('@/lib/prisma');
      const created = { userId: 'u-1', emailNotifications: true };
      (prisma.userNotificationSettings.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userNotificationSettings.create as jest.Mock).mockResolvedValue(created);

      const result = await usersService.updateUserNotificationSettings('u-1', { emailNotifications: true });

      expect(prisma.userNotificationSettings.create).toHaveBeenCalledWith({
        data: { userId: 'u-1', emailNotifications: true },
      });
      expect(result).toEqual(created);
    });
  });
});
