import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Panel3dInput, Panel3dUpdate } from '@/lib/validators/panel3d';
import { getNextPriority } from '@/lib/utils/priorityUtils';
import { priorityService } from '@/services/admin/priorityService';
import { mountingHardwareService } from '@/services/admin/mountingHardwareService';
import { logPriceChange } from '@/lib/audit-helpers';
import { cache } from '@/lib/cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/cache-keys';

export class Panel3dService {
  async getAll(params: {
    active?: boolean;
    search?: string;
    minHeight?: number;
    maxHeight?: number;
    minWidth?: number;
    maxWidth?: number;
    page?: number;
    pageSize?: number;
    validityFilter?: 'all' | 'active' | 'expired' | 'expiring_soon';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    console.log('[PANEL3D SERVICE] GET ALL called with params:', JSON.stringify(params, null, 2));

    const {
      active,
      search,
      minHeight,
      maxHeight,
      minWidth,
      maxWidth,
      page = 1,
      pageSize = 20,
      validityFilter = 'all',
      sortBy = 'priority',
      sortOrder = 'asc'
    } = params;
    const skip = (page - 1) * pageSize;
    const now = new Date();
    
    const where: Prisma.Panel3DWhereInput = {};
    
    if (active !== undefined) {
      where.active = active;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minHeight !== undefined || maxHeight !== undefined) {
      where.panelHeight = {};
      if (minHeight !== undefined) {
        where.panelHeight.gte = minHeight;
      }
      if (maxHeight !== undefined) {
        where.panelHeight.lte = maxHeight;
      }
    }

    if (minWidth !== undefined || maxWidth !== undefined) {
      where.panelWidth = {};
      if (minWidth !== undefined) {
        where.panelWidth.gte = minWidth;
      }
      if (maxWidth !== undefined) {
        where.panelWidth.lte = maxWidth;
      }
    }
    
    if (validityFilter === 'expired') {
      where.validUntil = { lt: now };
    } else if (validityFilter === 'expiring_soon') {
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.validUntil = {
        gt: now,
        lte: sevenDaysLater,
      };
    } else if (validityFilter === 'active') {
      where.active = true;
      where.OR = [
        { validUntil: null },
        { validUntil: { gt: now } },
      ];
    }
    
    const orderBy: Prisma.Panel3DOrderByWithRelationInput = {};
    if (sortBy && sortOrder) {
      orderBy[sortBy as keyof Prisma.Panel3DOrderByWithRelationInput] = sortOrder;
    }
    
    const [panel3d, total] = await Promise.all([
      prisma.panel3D.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.panel3D.count({ where }),
    ]);

    console.log('[PANEL3D SERVICE] GET ALL result:', {
      count: panel3d.length,
      total,
      page,
      totalPages: Math.ceil(total / pageSize)
    });

    return {
      panel3d,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string) {
    const item = await prisma.panel3D.findUnique({
      where: { id },
    });
    
    return item;
  }

  async create(data: Panel3dInput, userId: string) {
    console.log('[PANEL3D SERVICE] START CREATE - User:', userId);
    console.log('[PANEL3D SERVICE] Creating panel3d with data:', JSON.stringify(data, null, 2));

    const existing = await prisma.panel3D.findFirst({
      where: {
        name: data.name,
        panelHeight: data.panelHeight,
        panelWidth: data.panelWidth,
        rodDiameter: data.rodDiameter,
        cellWidth: data.cellWidth,
        cellHeight: data.cellHeight,
      },
    });

    if (existing) {
      console.log('[PANEL3D SERVICE] ERROR - Panel already exists:', existing.id, existing.name);
      throw new Error('3D-панель с такими параметрами уже существует');
    }

    const allItems = await prisma.panel3D.findMany({
      select: { id: true, priority: true },
    });
    const nextPriority = getNextPriority(allItems);

    const panel3d = await prisma.panel3D.create({
      data: {
        name: data.name,
        description: data.description,
        panelHeight: data.panelHeight,
        panelWidth: data.panelWidth,
        rodDiameter: data.rodDiameter,
        cellWidth: data.cellWidth,
        cellHeight: data.cellHeight,
        purchasePricePerUnit: data.purchasePricePerUnit,
        retailPricePerUnit: data.retailPricePerUnit,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        image: data.image,
        active: data.active ?? true,
        priority: nextPriority,
      },
    });

    console.log('[PANEL3D SERVICE] SUCCESS - Created panel3d:', {
      id: panel3d.id,
      name: panel3d.name,
      priority: panel3d.priority,
      createdAt: panel3d.createdAt
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'Panel3D',
        entityId: panel3d.id,
        fieldName: 'priority',
        oldValue: undefined,
        newValue: panel3d.priority,
        changedBy: userId,
      },
    });

    await this.clearCache();

    return panel3d;
  }

  async update(id: string, data: Panel3dUpdate, userId: string) {
    console.log('[PANEL3D SERVICE] Updating panel3d:', id, 'data:', JSON.stringify(data, null, 2));
    
    const oldItem = await prisma.panel3D.findUnique({
      where: { id },
    });
    
    if (!oldItem) {
      throw new Error('3D-панель не найдена');
    }

    const newName = data.name ?? oldItem.name;
    const newPanelHeight = data.panelHeight ?? oldItem.panelHeight;
    const newPanelWidth = data.panelWidth ?? oldItem.panelWidth;
    const newRodDiameter = data.rodDiameter ?? oldItem.rodDiameter;
    const newCellWidth = data.cellWidth ?? oldItem.cellWidth;
    const newCellHeight = data.cellHeight ?? oldItem.cellHeight;

    const uniqueFieldsChanged =
      newName !== oldItem.name ||
      newPanelHeight !== oldItem.panelHeight ||
      newPanelWidth !== oldItem.panelWidth ||
      newRodDiameter !== oldItem.rodDiameter ||
      newCellWidth !== oldItem.cellWidth ||
      newCellHeight !== oldItem.cellHeight;

    if (uniqueFieldsChanged) {
      const existing = await prisma.panel3D.findFirst({
        where: {
          id: { not: id },
          name: newName,
          panelHeight: newPanelHeight,
          panelWidth: newPanelWidth,
          rodDiameter: newRodDiameter,
          cellWidth: newCellWidth,
          cellHeight: newCellHeight,
        },
      });

      if (existing) {
        throw new Error('3D-панель с такими параметрами уже существует');
      }
    }

    const panel3d = await prisma.panel3D.update({
      where: { id },
      data,
    });

    console.log('[PANEL3D SERVICE] Updated panel3d:', panel3d.id);

    await this.logChange(id, 'UPDATE', oldItem, panel3d, userId);

    await this.clearCache();

    return panel3d;
  }

  async delete(id: string, userId: string) {
    const oldItem = await prisma.panel3D.findUnique({
      where: { id },
    });
    
    if (!oldItem) {
      throw new Error('3D-панель не найдена');
    }

    await mountingHardwareService.deleteRelationsForReference('PANEL_3D', id);

    await prisma.panel3D.delete({
      where: { id },
    });

    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'Panel3D',
        entityId: id,
        fieldName: 'deleted',
        oldValue: {
          id: oldItem.id,
          name: oldItem.name,
          priority: oldItem.priority,
        },
        newValue: undefined,
        changedBy: userId,
      },
    });

    await priorityService.recalculateAfterDelete('panel3D', userId);
    await this.clearCache();
  }

  async toggleActive(id: string, userId: string) {
    const oldItem = await prisma.panel3D.findUnique({
      where: { id },
    });
    
    if (!oldItem) {
      throw new Error('3D-панель не найдена');
    }

    const panel3d = await prisma.panel3D.update({
      where: { id },
      data: { active: !oldItem.active },
    });

    await this.logChange(id, 'TOGGLE_ACTIVE', oldItem, panel3d, userId);
    await this.clearCache();

    return panel3d;
  }

  async deactivateExpired() {
    const now = new Date();

    const result = await prisma.panel3D.updateMany({
      where: {
        validUntil: { lt: now },
        active: true,
      },
      data: { active: false },
    });

    console.log(`[CRON] Deactivated ${result.count} expired panel3d types`);
    await this.clearCache();
    return result.count;
  }

  async getMountingHardware(id: string) {
    const relations = await prisma.mountingHardwareRelation.findMany({
      where: {
        referenceType: 'PANEL_3D',
        referenceId: id,
        mountingHardware: { active: true },
      },
      include: {
        mountingHardware: true,
      },
      orderBy: {
        mountingHardware: { sortOrder: 'asc' },
      },
    });

    return relations.map(r => r.mountingHardware);
  }

  async addMountingHardware(id: string, mountingHardwareId: string, userId: string) {
    console.log('[PANEL3D SERVICE] Adding mounting hardware:', id, mountingHardwareId);

    const existing = await prisma.mountingHardwareRelation.findUnique({
      where: {
        mountingHardwareId_referenceType_referenceId: {
          mountingHardwareId,
          referenceType: 'PANEL_3D',
          referenceId: id,
        },
      },
    });

    if (existing) {
      throw new Error('Фурнитура уже привязана к этой 3D-панели');
    }

    await prisma.mountingHardwareRelation.create({
      data: {
        mountingHardwareId,
        referenceType: 'PANEL_3D',
        referenceId: id,
      },
    });

    await this.clearCache();
  }

  async removeMountingHardware(id: string, mountingHardwareId: string) {
    console.log('[PANEL3D SERVICE] Removing mounting hardware:', id, mountingHardwareId);

    await prisma.mountingHardwareRelation.deleteMany({
      where: {
        mountingHardwareId,
        referenceType: 'PANEL_3D',
        referenceId: id,
      },
    });

    await this.clearCache();
  }

  async getWorks(id: string) {
    const relations = await prisma.workRelation.findMany({
      where: {
        referenceType: 'PANEL_3D',
        referenceId: id,
        work: { active: true },
      },
      include: {
        work: true,
      },
      orderBy: {
        work: { sortOrder: 'asc' },
      },
    });

    return relations.map(r => r.work);
  }

  async addWork(id: string, workId: string, userId: string) {
    console.log('[PANEL3D SERVICE] Adding work:', id, workId);

    const existing = await prisma.workRelation.findFirst({
      where: {
        workId,
        fenceType: null,
        referenceType: 'PANEL_3D',
        referenceId: id,
      },
    });

    if (existing) {
      throw new Error('Работа уже привязана к этой 3D-панели');
    }

    await prisma.workRelation.create({
      data: {
        workId,
        fenceType: null,
        referenceType: 'PANEL_3D',
        referenceId: id,
      },
    });

    await this.clearCache();
  }

  async removeWork(id: string, workId: string) {
    console.log('[PANEL3D SERVICE] Removing work:', id, workId);

    await prisma.workRelation.deleteMany({
      where: {
        workId,
        fenceType: null,
        referenceType: 'PANEL_3D',
        referenceId: id,
      },
    });

    await this.clearCache();
  }

  private async clearCache() {
    await cache.del(CACHE_KEYS.PANEL_3D_ACTIVE);
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

    logPriceChange('Panel3D', entityId, oldValue, newValue, userId);

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
          entityType: 'Panel3D',
          entityId,
          fieldName: change.field,
          oldValue: change.oldValue as Prisma.InputJsonValue,
          newValue: change.newValue as Prisma.InputJsonValue,
          changedBy: userId,
        },
      });
    }
  }
}

export const panel3dService = new Panel3dService();
