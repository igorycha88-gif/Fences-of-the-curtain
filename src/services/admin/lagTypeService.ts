import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { LagTypeInput, LagTypeUpdate } from '@/lib/validators/lagType';

export class LagTypeService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    minThickness?: number;
    maxThickness?: number;
    page?: number;
    pageSize?: number;
  }) {
    const { active, search, minThickness, maxThickness, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.LagTypeWhereInput = {};

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minThickness !== undefined || maxThickness !== undefined) {
      where.metalThickness = {
        ...(minThickness !== undefined && { gte: minThickness }),
        ...(maxThickness !== undefined && { lte: maxThickness }),
      };
    }

    const [lags, total] = await Promise.all([
      prisma.lagType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.lagType.count({ where }),
    ]);

    return {
      lags,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    return prisma.lagType.findUnique({
      where: { id },
    });
  }

  async create(data: LagTypeInput, userId: string) {
    console.log('[LAG SERVICE] Creating lag with data:', JSON.stringify(data, null, 2));
    
    // Check if lag with same name already exists
    const existingLagByName = await prisma.lagType.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existingLagByName) {
      throw new Error('Лага с таким названием уже существует');
    }

    const lag = await prisma.lagType.create({
      data,
    });

    console.log('[LAG SERVICE] Created lag:', lag.id);

    await this.logChange(lag.id, 'CREATE', null, lag, userId);

    return lag;
  }

  async update(id: string, data: LagTypeUpdate, userId: string) {
    console.log('[LAG SERVICE] Updating lag:', id, 'data:', JSON.stringify(data, null, 2));
    
    const oldLag = await prisma.lagType.findUnique({
      where: { id },
    });

    if (!oldLag) {
      throw new Error('Лага не найдена');
    }

    // Check if name is being changed and if it already exists
    if (data.name && data.name !== oldLag.name) {
      const existingLagByName = await prisma.lagType.findFirst({
        where: {
          name: data.name,
          id: { not: id },
        },
      });

      if (existingLagByName) {
        throw new Error('Лага с таким названием уже существует');
      }
    }

    const lag = await prisma.lagType.update({
      where: { id },
      data,
    });

    console.log('[LAG SERVICE] Updated lag:', lag.id);

    await this.logChange(id, 'UPDATE', oldLag, lag, userId);

    return lag;
  }

  async delete(id: string, userId: string) {
    const oldLag = await prisma.lagType.findUnique({
      where: { id },
    });

    if (!oldLag) {
      throw new Error('Лага не найдена');
    }

    await prisma.lagType.delete({
      where: { id },
    });

    await this.logChange(id, 'DELETE', oldLag, null, userId);
  }

  async toggleActive(id: string, userId: string) {
    const oldLag = await prisma.lagType.findUnique({
      where: { id },
    });

    if (!oldLag) {
      throw new Error('Лага не найдена');
    }

    const lag = await prisma.lagType.update({
      where: { id },
      data: { active: !oldLag.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldLag, lag, userId);

    return lag;
  }

  private async logChange(
    entityId: string,
    action: string,
    oldValue: any,
    newValue: any,
    userId: string
  ) {
    if (action === 'CREATE' || action === 'DELETE') {
      return;
    }

    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (oldValue && newValue) {
      const fields = Object.keys(newValue) as Array<keyof typeof newValue>;
      
      for (const field of fields) {
        if (oldValue[field] !== newValue[field]) {
          changes.push({
            field: field as string,
            oldValue: oldValue[field],
            newValue: newValue[field],
          });
        }
      }
    }

    for (const change of changes) {
      await prisma.referenceChangeLog.create({
        data: {
          entityType: 'LagType',
          entityId,
          fieldName: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedBy: userId,
        },
      });
    }
  }
}

export const lagTypeService = new LagTypeService();
