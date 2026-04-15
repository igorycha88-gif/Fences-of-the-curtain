import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PostTypeInput, PostTypeUpdate } from '@/lib/validators/postType';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { createAuditLogAsync } from '@/lib/audit';

export interface PostDuplicate {
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

export class PostTypeService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    minThickness?: number;
    maxThickness?: number;
    page?: number;
    pageSize?: number;
    validityFilter?: 'all' | 'active' | 'expired' | 'expiring_soon';
  }) {
    const startTime = Date.now();
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

    const where: Prisma.PostTypeWhereInput = {};

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
      where.wallThickness = {
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
      const activeCondition = {
        OR: [
          { expirationDate: null },
          { expirationDate: { gt: now } },
        ]
      };
      if (where.OR) {
        where.AND = [where.OR, activeCondition] as [Prisma.PostTypeWhereInput, Prisma.PostTypeWhereInput];
      } else {
        where.OR = activeCondition.OR;
      }
    }

    const [posts, total] = await Promise.all([
      prisma.postType.findMany({
        where: where as Prisma.PostTypeWhereInput,
        skip,
        take: pageSize,
        orderBy: { priority: 'asc' },
      }),
      prisma.postType.count({ where: where as Prisma.PostTypeWhereInput }),
    ]);

    const duration = Date.now() - startTime;
    console.log(`[POST-SERVICE getAll] Completed in ${duration}ms, returned ${posts.length} posts, total: ${total}, params: ${JSON.stringify({ active, search, minThickness, maxThickness, page, pageSize, validityFilter })}`);

    return {
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    return prisma.postType.findUnique({
      where: { id },
    });
  }

  async findDuplicates(params: {
    sectionWidth: number;
    sectionHeight: number;
    wallThickness: number;
    length: number;
    excludeId?: string;
  }): Promise<PostDuplicate[]> {
    const posts = await prisma.postType.findMany({
      where: {
        sectionWidth: params.sectionWidth,
        sectionHeight: params.sectionHeight,
        wallThickness: params.wallThickness,
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

    return posts;
  }

  async create(data: PostTypeInput, userId: string) {
    const duplicates = await this.findDuplicates({
      sectionWidth: data.sectionWidth,
      sectionHeight: data.sectionHeight,
      wallThickness: data.wallThickness,
      length: data.length,
    });

    if (duplicates.length > 0 && !data.confirmDuplicate) {
      const newValidFrom = data.validFrom || null;
      const newExpirationDate = data.expirationDate || null;

      for (const dup of duplicates) {
        if (dup.retailPricePerUnit === data.retailPricePerUnit) {
          throw new Error('Цена должна отличаться от существующих столбов с такими же параметрами');
        }

        if (checkPeriodOverlap(newValidFrom, newExpirationDate, dup.validFrom, dup.expirationDate)) {
          return {
            warning: {
              type: 'duplicate_params',
              message: 'Столб с такими параметрами уже существует',
              duplicates: duplicates.map((d) => ({
                id: d.id,
                name: d.name,
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
      const existingPost = await prisma.postType.findUnique({
        where: { id: data.updateExistingExpiration },
      });

      if (existingPost && data.validFrom) {
        const newExpiration = new Date(data.validFrom);
        newExpiration.setDate(newExpiration.getDate() - 1);

        await prisma.postType.update({
          where: { id: data.updateExistingExpiration },
          data: { expirationDate: newExpiration },
        });
      }
    }

    const { confirmDuplicate, updateExistingExpiration, ...postData } = data as any;
    
    const allItems = await prisma.postType.findMany({
      select: { id: true, priority: true },
    });
    const nextPriority = getNextPriority(allItems as any);

    const post = await prisma.postType.create({
      data: {
        ...postData,
        priority: nextPriority,
      },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'PostType',
        entityId: post.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: post.priority,
        changedBy: userId,
      },
    });

    return post;
  }

  async update(id: string, data: PostTypeUpdate, userId: string) {
    const oldPost = await prisma.postType.findUnique({
      where: { id },
    });

    if (!oldPost) {
      throw new Error('Столб не найден');
    }

    const newSectionWidth = data.sectionWidth ?? oldPost.sectionWidth;
    const newSectionHeight = data.sectionHeight ?? oldPost.sectionHeight;
    const newWallThickness = data.wallThickness ?? oldPost.wallThickness;
    const newLength = data.length ?? oldPost.length;

    const uniqueFieldsChanged =
      newSectionWidth !== oldPost.sectionWidth ||
      newSectionHeight !== oldPost.sectionHeight ||
      newWallThickness !== oldPost.wallThickness ||
      newLength !== oldPost.length;

    if (uniqueFieldsChanged) {
      const existingPost = await prisma.postType.findFirst({
        where: {
          sectionWidth: newSectionWidth,
          sectionHeight: newSectionHeight,
          wallThickness: newWallThickness,
          length: newLength,
          id: { not: id },
        },
      });

      if (existingPost) {
        throw new Error('Столб с такими параметрами уже существует');
      }
    }

    const { confirmDuplicate, updateExistingExpiration, ...postData } = data as any;
    const post = await prisma.postType.update({
      where: { id },
      data: postData,
    });

    await this.logChange(id, 'UPDATE', oldPost, post, userId);

    return post;
  }

  async delete(id: string, userId: string) {
    const oldPost = await prisma.postType.findUnique({
      where: { id },
    });

    if (!oldPost) {
      throw new Error('Столб не найден');
    }

    await mountingHardwareService.deleteRelationsForReference('POST', id);

    await prisma.postType.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'PostType',
        entityId: id,
        fieldName: 'deleted',
        oldValue: {
          id: oldPost.id,
          name: oldPost.name,
          priority: oldPost.priority,
        },
        newValue: undefined,
        changedBy: userId,
      },
    });

    await priorityService.recalculateAfterDelete('postType', userId);
  }

  async toggleActive(id: string, userId: string) {
    const oldPost = await prisma.postType.findUnique({
      where: { id },
    });

    if (!oldPost) {
      throw new Error('Столб не найден');
    }

    const post = await prisma.postType.update({
      where: { id },
      data: { active: !oldPost.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldPost, post, userId);

    return post;
  }

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.postType.updateMany({
      where: {
        expirationDate: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired posts`);
    return result.count;
  }

  private async logChange(
    entityId: string,
    action: string,
    oldValue: any,
    newValue: any,
    userId: string,
  ) {
    if (action === 'CREATE' || action === 'DELETE') {
      return;
    }

    const priceFields = ['retailPricePerUnit', 'purchasePricePerUnit'];
    const changes: Record<string, { old: unknown; new: unknown }> = {};

    if (oldValue && newValue) {
      const fields = Object.keys(newValue) as Array<keyof typeof newValue>;

      for (const field of fields) {
        if (oldValue[field] !== newValue[field]) {
          changes[field as string] = {
            old: oldValue[field],
            new: newValue[field],
          };
        }
      }
    }

    const priceChanges = Object.keys(changes).filter((f) => priceFields.includes(f));

    if (priceChanges.length > 0) {
      const oldPrices: Record<string, unknown> = {};
      const newPrices: Record<string, unknown> = {};

      for (const field of priceChanges) {
        oldPrices[field] = changes[field].old;
        newPrices[field] = changes[field].new;
      }

      createAuditLogAsync({
        userId,
        action: 'UPDATE_PRICE',
        entityType: 'PostType',
        entityId,
        oldValues: oldPrices as Prisma.InputJsonValue,
        newValues: newPrices as Prisma.InputJsonValue,
      });
    }

    for (const field of Object.keys(changes)) {
      await prisma.referenceChangeLog.create({
        data: {
          entityType: 'PostType',
          entityId,
          fieldName: field,
          oldValue: changes[field].old as Prisma.InputJsonValue,
          newValue: changes[field].new as Prisma.InputJsonValue,
          changedBy: userId,
        },
      });
    }
  }
}

export const postTypeService = new PostTypeService();
