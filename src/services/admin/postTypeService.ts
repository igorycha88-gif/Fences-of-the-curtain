import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PostTypeInput, PostTypeUpdate } from '@/lib/validators/postType';

export class PostTypeService {
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

    const [posts, total] = await Promise.all([
      prisma.postType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.postType.count({ where }),
    ]);

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

  async create(data: PostTypeInput, userId: string) {
    const existingPost = await prisma.postType.findFirst({
      where: {
        sectionWidth: data.sectionWidth,
        sectionHeight: data.sectionHeight,
        wallThickness: data.wallThickness,
      },
    });

    if (existingPost) {
      throw new Error('Столб с такими параметрами уже существует');
    }

    const post = await prisma.postType.create({
      data,
    });

    await this.logChange(post.id, 'CREATE', null, post, userId);

    return post;
  }

  async update(id: string, data: PostTypeUpdate, userId: string) {
    const oldPost = await prisma.postType.findUnique({
      where: { id },
    });

    if (!oldPost) {
      throw new Error('Столб не найден');
    }

    if (
      data.sectionWidth !== undefined ||
      data.sectionHeight !== undefined ||
      data.wallThickness !== undefined
    ) {
      const width = data.sectionWidth ?? oldPost.sectionWidth;
      const height = data.sectionHeight ?? oldPost.sectionHeight;
      const thickness = data.wallThickness ?? oldPost.wallThickness;

      const existingPost = await prisma.postType.findFirst({
        where: {
          sectionWidth: width,
          sectionHeight: height,
          wallThickness: thickness,
          id: { not: id },
        },
      });

      if (existingPost) {
        throw new Error('Столб с такими параметрами уже существует');
      }
    }

    const post = await prisma.postType.update({
      where: { id },
      data,
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

    await prisma.postType.delete({
      where: { id },
    });

    await this.logChange(id, 'DELETE', oldPost, null, userId);
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
          entityType: 'PostType',
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

export const postTypeService = new PostTypeService();
