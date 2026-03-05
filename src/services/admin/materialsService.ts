import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class MaterialsService {
  async getFenceMaterials(params: {
    category?: string;
    active?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { category, active, search, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.FenceMaterialWhereInput = {};

    if (category) {
      where.category = category as any;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.fenceMaterial.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.fenceMaterial.count({ where }),
    ]);

    return {
      materials,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getFenceMaterialById(id: string) {
    return prisma.fenceMaterial.findUnique({
      where: { id },
    });
  }

  async createFenceMaterial(data: Prisma.FenceMaterialCreateInput, userId: string) {
    const material = await prisma.fenceMaterial.create({
      data,
    });

    await this.logPriceChange('FenceMaterial', material.id, 'basePrice', null, String(data.basePrice), userId);

    return material;
  }

  async updateFenceMaterial(id: string, data: Prisma.FenceMaterialUpdateInput, userId: string) {
    const existing = await prisma.fenceMaterial.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Material not found');
    }

    const material = await prisma.fenceMaterial.update({
      where: { id },
      data,
    });

    if (data.basePrice !== undefined && data.basePrice !== existing.basePrice) {
      await this.logPriceChange(
        'FenceMaterial',
        id,
        'basePrice',
        String(existing.basePrice),
        String(data.basePrice),
        userId
      );
    }

    return material;
  }

  async deleteFenceMaterial(id: string) {
    return prisma.fenceMaterial.delete({
      where: { id },
    });
  }

  async batchUpdatePrices(updates: Array<{ id: string; basePrice: number }>, userId: string) {
    const results = await Promise.all(
      updates.map(async ({ id, basePrice }) => {
        const existing = await prisma.fenceMaterial.findUnique({ where: { id } });
        if (!existing) return null;

        const material = await prisma.fenceMaterial.update({
          where: { id },
          data: { basePrice },
        });

        await this.logPriceChange(
          'FenceMaterial',
          id,
          'basePrice',
          String(existing.basePrice),
          String(basePrice),
          userId
        );

        return material;
      })
    );

    return results.filter(Boolean);
  }

  async getCanopyMaterials(params: {
    category?: string;
    active?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { category, active, search, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CanopyMaterialWhereInput = {};

    if (category) {
      where.category = category as any;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.canopyMaterial.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.canopyMaterial.count({ where }),
    ]);

    return {
      materials,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getCanopyMaterialById(id: string) {
    return prisma.canopyMaterial.findUnique({
      where: { id },
    });
  }

  async createCanopyMaterial(data: Prisma.CanopyMaterialCreateInput, userId: string) {
    const material = await prisma.canopyMaterial.create({
      data,
    });

    await this.logPriceChange('CanopyMaterial', material.id, 'basePrice', null, String(data.basePrice), userId);

    return material;
  }

  async updateCanopyMaterial(id: string, data: Prisma.CanopyMaterialUpdateInput, userId: string) {
    const existing = await prisma.canopyMaterial.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Material not found');
    }

    const material = await prisma.canopyMaterial.update({
      where: { id },
      data,
    });

    if (data.basePrice !== undefined && data.basePrice !== existing.basePrice) {
      await this.logPriceChange(
        'CanopyMaterial',
        id,
        'basePrice',
        String(existing.basePrice),
        String(data.basePrice),
        userId
      );
    }

    return material;
  }

  async deleteCanopyMaterial(id: string) {
    return prisma.canopyMaterial.delete({
      where: { id },
    });
  }

  async getFenceTypes(params: { active?: boolean }) {
    return prisma.fenceType.findMany({
      where: params.active !== undefined ? { active: params.active } : undefined,
      orderBy: { id: 'asc' },
    });
  }

  async getCanopyTypes(params: { active?: boolean }) {
    return prisma.canopyType.findMany({
      where: params.active !== undefined ? { active: params.active } : undefined,
      orderBy: { id: 'asc' },
    });
  }

  async getPostTypes(params: { active?: boolean }) {
    return prisma.postType.findMany({
      where: params.active !== undefined ? { active: params.active } : undefined,
      orderBy: { id: 'asc' },
    });
  }

  async getSoilTypes(params: { active?: boolean }) {
    return prisma.soilType.findMany({
      where: params.active !== undefined ? { active: params.active } : undefined,
      orderBy: { id: 'asc' },
    });
  }

  async getWorkPrices(params: { category?: string; active?: boolean }) {
    return prisma.workPrice.findMany({
      where: {
        ...(params.category && { category: params.category }),
        ...(params.active !== undefined && { active: params.active }),
      },
      orderBy: { id: 'asc' },
    });
  }

  private async logPriceChange(
    entityType: string,
    entityId: string,
    fieldName: string,
    oldValue: string | null,
    newValue: string,
    changedBy: string
  ) {
    await (prisma as any).priceHistory.create({
      data: {
        entityType,
        entityId,
        fieldName,
        oldValue,
        newValue,
        changedBy,
      },
    });
  }
}

export const materialsService = new MaterialsService();
