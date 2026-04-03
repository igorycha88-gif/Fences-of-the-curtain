import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface NotificationRecipientInput {
  email: string;
  name?: string;
  active?: boolean;
}

export interface NotificationRecipientFilters {
  active?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
}

export class NotificationRecipientService {
  async getRecipients(params: NotificationRecipientFilters = {}) {
    const { active, page = 1, pageSize = 20, search } = params;

    const where: Prisma.NotificationRecipientWhereInput = {};
    if (active !== undefined) where.active = active;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [recipients, total] = await Promise.all([
      prisma.notificationRecipient.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notificationRecipient.count({ where }),
    ]);

    return { recipients, total, page, pageSize };
  }

  async getActiveRecipients() {
    return prisma.notificationRecipient.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createRecipient(data: NotificationRecipientInput) {
    return prisma.notificationRecipient.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name || null,
        active: data.active ?? true,
      },
    });
  }

  async updateRecipient(id: string, data: Partial<NotificationRecipientInput>) {
    const updateData: Prisma.NotificationRecipientUpdateInput = {};
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
    if (data.name !== undefined) updateData.name = data.name || null;
    if (data.active !== undefined) updateData.active = data.active;

    return prisma.notificationRecipient.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteRecipient(id: string) {
    return prisma.notificationRecipient.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const recipient = await prisma.notificationRecipient.findUnique({
      where: { id },
      select: { active: true },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    return prisma.notificationRecipient.update({
      where: { id },
      data: { active: !recipient.active },
    });
  }
}

export const notificationRecipientService = new NotificationRecipientService();
