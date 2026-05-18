import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PAGE_METADATA, SEO_CONFIG } from '@/lib/seo/constants';

export class SeoMonitoringService {
  async getKeywords(params: {
    search?: string;
    group?: string;
    searchEngine?: string;
    active?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const { search, group, searchEngine, active, page = 1, pageSize = 50 } = params;

    const where: Prisma.SeoKeywordWhereInput = {};
    if (search) {
      where.keyword = { contains: search, mode: 'insensitive' };
    }
    if (group) {
      where.group = group;
    }
    if (searchEngine) {
      where.searchEngine = searchEngine;
    }
    if (active !== undefined) {
      where.active = active;
    }

    const [items, total] = await Promise.all([
      prisma.seoKeyword.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { keyword: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          positions: {
            orderBy: { checkedAt: 'desc' },
            take: 2,
          },
        },
      }),
      prisma.seoKeyword.count({ where }),
    ]);

    const itemsWithCurrent = items.map((item) => {
      const currentPosition = item.positions[0]?.position ?? null;
      const previousPosition = item.positions[1]?.position ?? null;
      const change =
        currentPosition !== null && previousPosition !== null
          ? previousPosition - currentPosition
          : null;
      const lastChecked = item.positions[0]?.checkedAt ?? null;

      return {
        id: item.id,
        keyword: item.keyword,
        searchEngine: item.searchEngine,
        pagePath: item.pagePath,
        group: item.group,
        active: item.active,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        currentPosition,
        previousPosition,
        change,
        lastChecked,
      };
    });

    return {
      items: itemsWithCurrent,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createKeyword(data: {
    keyword: string;
    searchEngine: string;
    group?: string;
    pagePath?: string;
  }) {
    return prisma.seoKeyword.create({
      data: {
        keyword: data.keyword,
        searchEngine: data.searchEngine,
        group: data.group || null,
        pagePath: data.pagePath || null,
      },
    });
  }

  async updateKeyword(
    id: string,
    data: { active?: boolean; group?: string; sortOrder?: number }
  ) {
    const existing = await prisma.seoKeyword.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Ключевое слово не найдено');
    }

    return prisma.seoKeyword.update({
      where: { id },
      data: {
        ...(data.active !== undefined && { active: data.active }),
        ...(data.group !== undefined && { group: data.group }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async deleteKeyword(id: string) {
    const existing = await prisma.seoKeyword.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Ключевое слово не найдено');
    }

    return prisma.seoKeyword.delete({ where: { id } });
  }

  async seedFromConfig() {
    const pageEntries = Object.entries(PAGE_METADATA) as [
      string,
      (typeof PAGE_METADATA)[keyof typeof PAGE_METADATA]
    ][];

    const allKeywords: {
      keyword: string;
      group: string;
      pagePath: string;
    }[] = [];

    for (const [pageKey, meta] of pageEntries) {
      for (const kw of meta.keywords) {
        allKeywords.push({
          keyword: kw,
          group: pageKey,
          pagePath: meta.path,
        });
      }
    }

    for (const kw of SEO_CONFIG.DEFAULT_KEYWORDS) {
      if (!allKeywords.some((k) => k.keyword === kw)) {
        allKeywords.push({
          keyword: kw,
          group: 'default',
          pagePath: '/',
        });
      }
    }

    const uniqueKeywords = Array.from(
      new Map(allKeywords.map((k) => [k.keyword, k])).values()
    );

    let created = 0;
    let skipped = 0;

    for (const searchEngine of ['google', 'yandex'] as const) {
      for (const kw of uniqueKeywords) {
        const existing = await prisma.seoKeyword.findUnique({
          where: {
            keyword_searchEngine: {
              keyword: kw.keyword,
              searchEngine,
            },
          },
        });

        if (!existing) {
          await prisma.seoKeyword.create({
            data: {
              keyword: kw.keyword,
              searchEngine,
              group: kw.group,
              pagePath: kw.pagePath,
            },
          });
          created++;
        } else {
          skipped++;
        }
      }
    }

    return { created, skipped };
  }

  async getPositions(params: {
    keywordId?: string;
    searchEngine?: string;
    group?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }) {
    const {
      keywordId,
      searchEngine,
      group,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 100,
    } = params;

    const where: Prisma.SeoPositionWhereInput = {};
    if (keywordId) {
      where.keywordId = keywordId;
    }
    if (searchEngine || group) {
      where.keyword = {};
      if (searchEngine) {
        where.keyword.searchEngine = searchEngine;
      }
      if (group) {
        where.keyword.group = group;
      }
    }
    if (dateFrom || dateTo) {
      where.checkedAt = {};
      if (dateFrom) {
        where.checkedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.checkedAt.lte = new Date(dateTo);
      }
    }

    const [items, total] = await Promise.all([
      prisma.seoPosition.findMany({
        where,
        orderBy: { checkedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          keyword: {
            select: {
              keyword: true,
              searchEngine: true,
              group: true,
            },
          },
        },
      }),
      prisma.seoPosition.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getSummary(searchEngine?: string) {
    const keywords = await prisma.seoKeyword.findMany({
      where: {
        active: true,
        ...(searchEngine && { searchEngine }),
      },
      include: {
        positions: {
          orderBy: { checkedAt: 'desc' },
          take: 2,
        },
      },
    });

    let top3 = 0;
    let top5 = 0;
    let top10 = 0;
    let notFound = 0;
    let totalWithPosition = 0;
    let sumPositions = 0;
    let improved = 0;
    let declined = 0;
    let unchanged = 0;

    for (const kw of keywords) {
      const current = kw.positions[0];
      const previous = kw.positions[1];

      if (!current) {
        notFound++;
        continue;
      }

      if (current.found && current.position > 0) {
        totalWithPosition++;
        sumPositions += current.position;

        if (current.position <= 3) top3++;
        if (current.position <= 5) top5++;
        if (current.position <= 10) top10++;

        if (previous?.found && previous.position > 0) {
          const change = previous.position - current.position;
          if (change > 0) improved++;
          else if (change < 0) declined++;
          else unchanged++;
        }
      } else {
        notFound++;
      }
    }

    return {
      totalKeywords: keywords.length,
      top3,
      top5,
      top10,
      notFound,
      avgPosition:
        totalWithPosition > 0
          ? Math.round((sumPositions / totalWithPosition) * 10) / 10
          : null,
      improved,
      declined,
      unchanged,
    };
  }
}

export const seoMonitoringService = new SeoMonitoringService();
