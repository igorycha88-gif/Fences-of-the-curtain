import { prisma } from '@/lib/prisma';
import { FenceHeightInput, FenceHeightUpdate } from '@/lib/validators/fenceHeight';

export class FenceHeightService {
  async getAll(params: {
    category?: string;
    active?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { category, active, search, page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (category) {
      where.category = category;
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
        include: {
          fenceType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
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

  async addHeight(data: FenceHeightInput, userId: string) {
    const material = await prisma.fenceMaterial.findUnique({
      where: { id: data.materialId },
    });

    if (!material) {
      throw new Error('Материал не найден');
    }

    const currentHeights: any[] = (material.availableHeights as any[]) || [];

    const heightExists = currentHeights.some((h: any) => h.height === data.height);
    if (heightExists) {
      throw new Error('Такая высота уже существует для данного материала');
    }

    const newHeight = {
      height: data.height,
      priceCoef: data.priceCoef,
      isCustom: data.isCustom,
      comment: data.comment,
    };

    const updatedHeights = [...currentHeights, newHeight];

    const updatedMaterial = await prisma.fenceMaterial.update({
      where: { id: data.materialId },
      data: {
        availableHeights: updatedHeights,
      },
    });

    await this.logChange(
      data.materialId,
      'ADD_HEIGHT',
      currentHeights,
      updatedHeights,
      userId
    );

    return updatedMaterial;
  }

  async updateHeight(
    materialId: string,
    height: number,
    data: FenceHeightUpdate,
    userId: string
  ) {
    const material = await prisma.fenceMaterial.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new Error('Материал не найден');
    }

    const currentHeights: any[] = (material.availableHeights as any[]) || [];
    const heightIndex = currentHeights.findIndex((h: any) => h.height === height);

    if (heightIndex === -1) {
      throw new Error('Высота не найдена');
    }

    const oldHeight = currentHeights[heightIndex];
    const updatedHeight = {
      ...oldHeight,
      ...(data.priceCoef !== undefined && { priceCoef: data.priceCoef }),
      ...(data.comment !== undefined && { comment: data.comment }),
    };

    const updatedHeights = [...currentHeights];
    updatedHeights[heightIndex] = updatedHeight;

    const updatedMaterial = await prisma.fenceMaterial.update({
      where: { id: materialId },
      data: {
        availableHeights: updatedHeights,
      },
    });

    await this.logChange(
      materialId,
      'UPDATE_HEIGHT',
      currentHeights,
      updatedHeights,
      userId
    );

    return updatedMaterial;
  }

  async deleteHeight(materialId: string, height: number, userId: string) {
    const material = await prisma.fenceMaterial.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new Error('Материал не найден');
    }

    const currentHeights: any[] = (material.availableHeights as any[]) || [];
    const updatedHeights = currentHeights.filter((h: any) => h.height !== height);

    if (updatedHeights.length === currentHeights.length) {
      throw new Error('Высота не найдена');
    }

    const updatedMaterial = await prisma.fenceMaterial.update({
      where: { id: materialId },
      data: {
        availableHeights: updatedHeights,
      },
    });

    await this.logChange(
      materialId,
      'DELETE_HEIGHT',
      currentHeights,
      updatedHeights,
      userId
    );

    return updatedMaterial;
  }

  private async logChange(
    entityId: string,
    action: string,
    oldValue: any,
    newValue: any,
    userId: string
  ) {
    await prisma.referenceChangeLog.create({
      data: {
        entityType: 'FenceMaterial',
        entityId,
        fieldName: 'availableHeights',
        oldValue,
        newValue,
        changedBy: userId,
      },
    });
  }
}

export const fenceHeightService = new FenceHeightService();
