import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCityByIP } from './ipLookupService';
import {
  calculateExtendedItems,
  calculateSummary,
  EstimateItem,
  ExtendedEstimateItem,
  EstimateSummary,
} from '@/lib/utils/marginCalculator';

export interface EstimatesQueryParams {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  fenceTypeId?: string;
  minCost?: number;
  maxCost?: number;
  hasGate?: boolean;
  hasWicket?: boolean;
  deviceType?: 'desktop' | 'mobile';
  search?: string;
}

function getDeviceType(userAgent: string | null): 'desktop' | 'mobile' {
  if (!userAgent) return 'desktop';
  const mobileRegex = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent) ? 'mobile' : 'desktop';
}

export class EstimatesService {
  async getEstimates(params: EstimatesQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      dateFrom,
      dateTo,
      fenceTypeId,
      minCost,
      maxCost,
      hasGate,
      hasWicket,
      deviceType,
      search,
    } = params;

    const limit = Math.min(pageSize, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.FenceEstimateWhereInput = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    if (fenceTypeId) {
      where.fenceTypeId = fenceTypeId;
    }

    if (minCost !== undefined || maxCost !== undefined) {
      where.grandTotal = {};
      if (minCost !== undefined) {
        where.grandTotal.gte = minCost;
      }
      if (maxCost !== undefined) {
        where.grandTotal.lte = maxCost;
      }
    }

    if (hasGate !== undefined) {
      where.hasGate = hasGate;
    }

    if (hasWicket !== undefined) {
      where.hasWicket = hasWicket;
    }

    if (search) {
      where.OR = [
        { city: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const estimates = await prisma.fenceEstimate.findMany({
      where,
      skip,
      take: limit,
      include: {
        fenceType: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.fenceEstimate.count({ where });

    const estimatesWithDeviceType = estimates.map((estimate) => ({
      ...estimate,
      deviceType: getDeviceType(estimate.userAgent),
    }));

    if (deviceType) {
      const filtered = estimatesWithDeviceType.filter((e) => e.deviceType === deviceType);
      return {
        estimates: filtered,
        total: filtered.length,
        page,
        pageSize: limit,
        totalPages: Math.ceil(filtered.length / limit),
      };
    }

    return {
      estimates: estimatesWithDeviceType,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEstimateById(id: string) {
    const estimate = await prisma.fenceEstimate.findUnique({
      where: { id },
      include: {
        fenceType: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!estimate) {
      return null;
    }

    return {
      ...estimate,
      deviceType: getDeviceType(estimate.userAgent),
    };
  }

  async getEstimateByIdWithMargin(
    id: string,
    includePurchasePrices: boolean = false
  ): Promise<{
    id: string;
    createdAt: Date;
    fenceType: { id: string; name: string } | null;
    fenceTypeId: string;
    length: number;
    height: number;
    lagRows: number;
    coating: string;
    hasGate: boolean;
    gateType: string | null;
    gateLength: number | null;
    gateNomenclatureName: string | null;
    gateTotal: number;
    gateInstallationTotal: number;
    hasWicket: boolean;
    wicketWidth: number | null;
    wicketNomenclatureName: string | null;
    wicketTotal: number;
    wicketInstallationTotal: number;
    postsTotal: number;
    lagsTotal: number;
    profnastilTotal: number;
    mountingHardwareTotal: number;
    installationTotal: number;
    materialsTotal: number;
    grandTotal: number;
    ipAddress: string | null;
    userAgent: string | null;
    city: string | null;
    user: { id: string; name: string | null; email: string | null; phone: string | null } | null;
    deviceType: 'desktop' | 'mobile';
    items: ExtendedEstimateItem[];
    summary?: EstimateSummary;
  } | null> {
    const estimate = await prisma.fenceEstimate.findUnique({
      where: { id },
      include: {
        fenceType: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!estimate) {
      return null;
    }

    const baseItems: EstimateItem[] = estimate.items
      ? (JSON.parse(JSON.stringify(estimate.items)) as EstimateItem[])
      : [];

    let items: ExtendedEstimateItem[];
    let summary: EstimateSummary | undefined;

    if (includePurchasePrices) {
      items = await calculateExtendedItems(baseItems);
      summary = calculateSummary(items);
    } else {
      items = baseItems.map((item) => ({
        ...item,
        purchasePricePerUnit: null,
        purchaseTotal: null,
        marginRub: null,
        marginPercent: null,
      }));
    }

    return {
      id: estimate.id,
      createdAt: estimate.createdAt,
      fenceType: estimate.fenceType,
      fenceTypeId: estimate.fenceTypeId,
      length: estimate.length,
      height: estimate.height,
      lagRows: estimate.lagRows,
      coating: estimate.coating,
      hasGate: estimate.hasGate,
      gateType: estimate.gateType,
      gateLength: estimate.gateLength,
      gateNomenclatureName: estimate.gateNomenclatureName,
      gateTotal: estimate.gateTotal,
      gateInstallationTotal: estimate.gateInstallationTotal,
      hasWicket: estimate.hasWicket,
      wicketWidth: estimate.wicketWidth,
      wicketNomenclatureName: estimate.wicketNomenclatureName,
      wicketTotal: estimate.wicketTotal,
      wicketInstallationTotal: estimate.wicketInstallationTotal,
      postsTotal: estimate.postsTotal,
      lagsTotal: estimate.lagsTotal,
      profnastilTotal: estimate.profnastilTotal,
      mountingHardwareTotal: estimate.mountingHardwareTotal,
      installationTotal: estimate.installationTotal,
      materialsTotal: estimate.materialsTotal,
      grandTotal: estimate.grandTotal,
      ipAddress: estimate.ipAddress,
      userAgent: estimate.userAgent,
      city: estimate.city,
      user: estimate.user,
      deviceType: getDeviceType(estimate.userAgent),
      items,
      summary,
    };
  }

  async updateEstimateCity(id: string) {
    const estimate = await prisma.fenceEstimate.findUnique({
      where: { id },
      select: { ipAddress: true },
    });

    if (!estimate || !estimate.ipAddress) {
      return null;
    }

    const city = await getCityByIP(estimate.ipAddress);

    if (city) {
      return prisma.fenceEstimate.update({
        where: { id },
        data: { city },
      });
    }

    return null;
  }

  async getEstimatesForExport(params: EstimatesQueryParams) {
    const { pageSize, page, ...restParams } = params;
    const result = await this.getEstimates({ ...restParams, pageSize: 1000, page: 1 });
    return result.estimates;
  }

  async getFenceTypes() {
    return prisma.fenceType.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }
}

export const estimatesService = new EstimatesService();
