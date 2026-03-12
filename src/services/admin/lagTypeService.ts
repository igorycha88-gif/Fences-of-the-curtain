import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { LagTypeInput, LagTypeUpdate } from '@/lib/validators/lagType';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';

export interface LagDuplicate {
  id: string;
  name: string;
  retailPricePerUnit: number;
  validFrom: Date | null;
  expirationDate: Date | null;
  active: boolean;
}

export function checkPeriodOverlap(
  newValidFrom: Date | null,
  newExpirationDate: Date | null,
  existingValidFrom: Date | null,
  existingExpirationDate: Date | null
): boolean {
  const farFuture = new Date('2099-12-31');
  const farPast = new Date(0);

  const newStart = newValidFrom || farPast;
  const newEnd = newExpirationDate || farFuture;
  const existingStart = existingValidFrom || farPast;
  const existingEnd = existingExpirationDate || farFuture;

  return !(newStart >= existingEnd || newEnd <= existingStart);
}

export class LagTypeService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    minThickness?: number;
    maxThickness?: number;
    page?: number;
    pageSize?: number;
    validityFilter?: 'all' | 'active' | 'expired' | 'expiring_soon';
  }) {
    const { 
      active, 
      search, 
      minThickness, 
      maxThickness, 
      page = 1, 
      pageSize = 20,
      validityFilter = 'all'
    } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();

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

    if (validityFilter === 'expired') {
      where.expirationDate = { lt: now };
    } else if (validityFilter === 'expiring_soon') {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.expirationDate = {
        gt: now,
        lte: sevenDaysLater,
      };
    } else if (validityFilter === 'active') {
      where.active = true;
      where.OR = [
        { expirationDate: null },
        { expirationDate: { gt: now } },
      ];
    }

    const [lags, total] = await Promise.all([
      prisma.lagType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { priority: 'asc' },
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

  async findDuplicates(params: {
    width: number;
    height: number;
    metalThickness: number;
    length: number;
    excludeId?: string;
  }): Promise<LagDuplicate[]> {
    const lags = await prisma.lagType.findMany({
      where: {
        width: params.width,
        height: params.height,
        metalThickness: params.metalThickness,
        length: params.length,
        ...(params.excludeId && { id: { not: params.excludeId } }),
      },
      select: {
        id: true,
        name: true,
        retailPricePerUnit: true,
        validFrom: true,
        expirationDate: true,
        active: true,
      },
    });

    return lags;
  }

  async create(data: LagTypeInput, userId: string) {
    console.log('[LAG SERVICE] Creating lag with data:', JSON.stringify(data, null, 2));

    const duplicates = await this.findDuplicates({
      width: data.width,
      height: data.height,
      metalThickness: data.metalThickness,
      length: data.length,
    });

    if (duplicates.length > 0 && !data.confirmDuplicate) {
      const newValidFrom = data.validFrom || null;
      const newExpirationDate = data.expirationDate || null;

      for (const dup of duplicates) {
        if (dup.retailPricePerUnit === data.retailPricePerUnit) {
          throw new Error('Розничная цена должна отличаться от существующих номенклатур с такими же параметрами');
        }

        if (checkPeriodOverlap(newValidFrom, newExpirationDate, dup.validFrom, dup.expirationDate)) {
          return {
            warning: {
              type: 'duplicate_params',
              message: 'Номенклатура с такими параметрами уже существует',
              duplicates: duplicates.map((d) => ({
                id: d.id,
                name: duplicates.find((x) => x.id === d.id)?.name || '',
                retailPricePerUnit: d.retailPricePerUnit,
                validFrom: d.validFrom,
                expirationDate: d.expirationDate,
                active: d.active,
              })),
              suggestions: {
                setExpirationForExisting: data.validFrom
                  ? new Date(data.validFrom.getTime() - 24 * 60 * 60 * 1000)
                  : null,
              },
            },
            canProceed: true,
          };
        }
      }
    }

    if (data.confirmDuplicate && data.updateExistingExpiration) {
      const existingLag = await prisma.lagType.findUnique({
        where: { id: data.updateExistingExpiration },
      });

      if (existingLag && data.validFrom) {
        const newExpiration = new Date(data.validFrom);
        newExpiration.setDate(newExpiration.getDate() - 1);

        await prisma.lagType.update({
          where: { id: data.updateExistingExpiration },
          data: { expirationDate: newExpiration },
        });
      }
    }

    const { confirmDuplicate, updateExistingExpiration, ...lagData } = data as any;
    
    const allItems = await prisma.lagType.findMany({
      select: { id: true, priority: true },
    }) as any;
    const nextPriority = getNextPriority(allItems);

    const lag = await prisma.lagType.create({
      data: {
        ...lagData,
        priority: nextPriority,
      },
    });

    console.log('[LAG SERVICE] Created lag:', lag.id);

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'LagType',
        entityId: lag.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: lag.priority,
        changedBy: userId,
      },
    });

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

    const { confirmDuplicate, updateExistingExpiration, ...lagData } = data as any;
    const lag = await prisma.lagType.update({
      where: { id },
      data: lagData,
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

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'LagType',
        entityId: id,
        fieldName: 'deleted',
        oldValue: {
          id: oldLag.id,
          name: oldLag.name,
          priority: oldLag.priority,
        },
        newValue: undefined,
        changedBy: userId,
      },
    });

    await priorityService.recalculateAfterDelete('lagType', userId);
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

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.lagType.updateMany({
      where: {
        expirationDate: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired lags`);
    return result.count;
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
