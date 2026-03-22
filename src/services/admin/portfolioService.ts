import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { 
  PortfolioInput, 
  PortfolioUpdate, 
  PortfolioListParams,
  ReorderRequest 
} from '@/lib/validators/portfolio';
import { deleteImage } from '@/lib/utils/fileUpload';

export class PortfolioService {
  async getAll(params: PortfolioListParams) {
    const { page = 1, pageSize = 20, search, category, active } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PortfolioItemWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (active !== undefined) {
      where.active = active;
    }

    const [items, total] = await Promise.all([
      prisma.portfolioItem.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.portfolioItem.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    return prisma.portfolioItem.findUnique({
      where: { id },
    });
  }

  async create(data: PortfolioInput, userId: string) {
    const maxSortOrder = await prisma.portfolioItem.aggregate({
      _max: { sortOrder: true },
    });

    const item = await prisma.portfolioItem.create({
      data: {
        ...data,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });

    await this.logAction(item.id, 'CREATE', null, item, userId);

    return item;
  }

  async update(id: string, data: PortfolioUpdate, userId: string) {
    const oldItem = await prisma.portfolioItem.findUnique({ where: { id } });
    
    if (!oldItem) {
      throw new Error('Элемент портфолио не найден');
    }

    if (data.images) {
      const oldImages = oldItem.images as string[];
      const newImages = data.images;
      const removedImages = oldImages.filter(img => !newImages.includes(img));
      
      for (const img of removedImages) {
        await deleteImage(img);
      }
    }

    const item = await prisma.portfolioItem.update({
      where: { id },
      data,
    });

    await this.logAction(id, 'UPDATE', oldItem, item, userId);

    return item;
  }

  async delete(id: string, userId: string) {
    const item = await prisma.portfolioItem.findUnique({ where: { id } });
    
    if (!item) {
      throw new Error('Элемент портфолио не найден');
    }

    const images = item.images as string[];
    for (const img of images) {
      await deleteImage(img);
    }

    await prisma.portfolioItem.delete({ where: { id } });

    await this.logAction(id, 'DELETE', item, null, userId);
  }

  async toggleActive(id: string, userId: string) {
    const item = await prisma.portfolioItem.findUnique({ where: { id } });
    
    if (!item) {
      throw new Error('Элемент портфолио не найден');
    }

    const updated = await prisma.portfolioItem.update({
      where: { id },
      data: { active: !item.active },
    });

    await this.logAction(id, 'TOGGLE_ACTIVE', item, updated, userId);

    return updated;
  }

  async bulkActivate(ids: string[], userId: string) {
    const result = await prisma.portfolioItem.updateMany({
      where: { id: { in: ids } },
      data: { active: true },
    });

    await this.logBulkAction('BULK_ACTIVATE', ids, userId);

    return { updated: result.count, message: `Активировано ${result.count} элементов` };
  }

  async bulkDeactivate(ids: string[], userId: string) {
    const result = await prisma.portfolioItem.updateMany({
      where: { id: { in: ids } },
      data: { active: false },
    });

    await this.logBulkAction('BULK_DEACTIVATE', ids, userId);

    return { updated: result.count, message: `Деактивировано ${result.count} элементов` };
  }

  async bulkDelete(ids: string[], userId: string) {
    const items = await prisma.portfolioItem.findMany({
      where: { id: { in: ids } },
    });

    for (const item of items) {
      const images = item.images as string[];
      for (const img of images) {
        await deleteImage(img);
      }
    }

    const result = await prisma.portfolioItem.deleteMany({
      where: { id: { in: ids } },
    });

    await this.logBulkAction('BULK_DELETE', ids, userId);

    return { deleted: result.count, message: `Удалено ${result.count} элементов` };
  }

  async reorder(items: ReorderRequest['items'], userId: string) {
    await prisma.$transaction(
      items.map(item =>
        prisma.portfolioItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    await this.logBulkAction('REORDER', items.map(i => i.id), userId);

    return { updated: items.length, message: 'Порядок обновлён' };
  }

  async getPublicList(category?: 'fence' | 'canopy') {
    const where: Prisma.PortfolioItemWhereInput = {
      active: true,
    };

    if (category) {
      where.category = category;
    }

    return prisma.portfolioItem.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        type: true,
        description: true,
        images: true,
        active: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  private async logAction(
    entityId: string,
    action: string,
    oldValues: any,
    newValues: any,
    userId: string
  ) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: `PORTFOLIO_${action}`,
        entityType: 'PortfolioItem',
        entityId,
        oldValues,
        newValues,
      },
    });
  }

  private async logBulkAction(action: string, ids: string[], userId: string) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: `PORTFOLIO_${action}`,
        entityType: 'PortfolioItem',
        oldValues: { ids },
        newValues: Prisma.DbNull,
      },
    });
  }
}

export const portfolioService = new PortfolioService();
