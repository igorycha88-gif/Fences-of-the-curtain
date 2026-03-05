import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';

export class UsersService {
  async getUsers(params: {
    role?: Role;
    active?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { role, active, search, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
      },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  async updateUserPassword(id: string, newPassword: string) {
    return prisma.user.update({
      where: { id },
      data: { password: newPassword },
    });
  }

  async getUserNotificationSettings(userId: string) {
    return (prisma as any).userNotificationSettings.findUnique({
      where: { userId },
    });
  }

  async updateUserNotificationSettings(userId: string, data: any) {
    const existing = await (prisma as any).userNotificationSettings.findUnique({
      where: { userId },
    });

    if (existing) {
      return (prisma as any).userNotificationSettings.update({
        where: { userId },
        data,
      });
    }

    return (prisma as any).userNotificationSettings.create({
      data: {
        userId,
        ...data,
      },
    });
  }
}

export const usersService = new UsersService();
