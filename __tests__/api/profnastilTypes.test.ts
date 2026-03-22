import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '@/app/api/admin/profnastil-types/route';
import { PUT, GET } from '@/app/api/admin/profnastil-types/[id]/route';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/services/admin/profnastilTypeService', () => ({
  profnastilTypeService: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/lib/validators/profnastilType', () => ({
  profnastilTypeSchema: {
    parse: jest.fn(),
  },
  profnastilTypeUpdateSchema: {
    parse: jest.fn(),
  },
}));

describe('POST /api/admin/profnastil-types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should auto-calculate purchasePricePerUnit', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'admin-id',
        role: 'ADMIN',
      },
    });

    const { profnastilTypeSchema } = await import('@/lib/validators/profnastilType');
    (profnastilTypeSchema.parse as jest.Mock).mockReturnValue({
      name: 'Тестовый профнастил',
      metalThickness: 0.5,
      fullWidth: 1200,
      usefulWidth: 1150,
      length: 2000,
      coating: 'Полимерное (одностороннее)',
      purchasePricePerLinearMeter: 350,
      retailPricePerUnit: 1200,
      active: true,
    });

    const { profnastilTypeService } = await import('@/services/admin/profnastilTypeService');
    (profnastilTypeService.create as jest.Mock).mockResolvedValue({
      id: 'test-id',
      purchasePricePerUnit: 700,
    });

    const request = {
      json: jest.fn().mockResolvedValue({
        name: 'Тестовый профнастил',
        metalThickness: 0.5,
        fullWidth: 1200,
        usefulWidth: 1150,
        length: 2000,
        coating: 'Полимерное (одностороннее)',
        purchasePricePerLinearMeter: 350,
        retailPricePerUnit: 1200,
      }),
    } as any;

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(profnastilTypeService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purchasePricePerUnit: 700,
      }),
      'admin-id'
    );
  });

  it('should forbid non-admin from setting purchase prices', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'manager-id',
        role: 'MANAGER',
      },
    });

    const request = {
      json: jest.fn().mockResolvedValue({
        name: 'Тестовый профнастил',
        purchasePricePerLinearMeter: 350,
      }),
    } as any;

    const response = await POST(request);

    expect(response.status).toBe(403);
  });
});

describe('PUT /api/admin/profnastil-types/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should recalculate purchasePricePerUnit on update', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'admin-id',
        role: 'ADMIN',
      },
    });

    const { profnastilTypeUpdateSchema } = await import('@/lib/validators/profnastilType');
    (profnastilTypeUpdateSchema.parse as jest.Mock).mockReturnValue({
      length: 2500,
      purchasePricePerLinearMeter: 380,
    });

    const { profnastilTypeService } = await import('@/services/admin/profnastilTypeService');
    (profnastilTypeService.update as jest.Mock).mockResolvedValue({
      id: 'test-id',
      length: 2500,
      purchasePricePerLinearMeter: 380,
      purchasePricePerUnit: 950,
    });

    const request = {
      json: jest.fn().mockResolvedValue({
        length: 2500,
        purchasePricePerLinearMeter: 380,
      }),
    } as any;

    const response = await PUT(request, { params: { id: 'test-id' } });

    expect(response.status).toBe(200);
    expect(profnastilTypeService.update).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        length: 2500,
        purchasePricePerLinearMeter: 380,
      }),
      'admin-id'
    );
  });

  it('should forbid non-admin from modifying purchase prices', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'manager-id',
        role: 'MANAGER',
      },
    });

    const request = {
      json: jest.fn().mockResolvedValue({
        purchasePricePerLinearMeter: 400,
      }),
    } as any;

    const response = await PUT(request, { params: { id: 'test-id' } });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/admin/profnastil-types/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return both price fields for ADMIN', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'admin-id',
        role: 'ADMIN',
      },
    });

    const { profnastilTypeService } = await import('@/services/admin/profnastilTypeService');
    (profnastilTypeService.getById as jest.Mock).mockResolvedValue({
      id: 'test-id',
      name: 'Профнастил С8',
      purchasePricePerLinearMeter: 350,
      purchasePricePerUnit: 700,
      retailPricePerUnit: 1200,
    });

    const response = await GET(new Request('http://localhost'), { params: { id: 'test-id' } });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('purchasePricePerLinearMeter');
    expect(data).toHaveProperty('purchasePricePerUnit');
  });

  it('should hide purchase price fields for MANAGER', async () => {
    const { getServerSession } = await import('next-auth');
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'manager-id',
        role: 'MANAGER',
      },
    });

    const { profnastilTypeService } = await import('@/services/admin/profnastilTypeService');
    (profnastilTypeService.getById as jest.Mock).mockResolvedValue({
      id: 'test-id',
      name: 'Профнастил С8',
      purchasePricePerLinearMeter: 350,
      purchasePricePerUnit: 700,
      retailPricePerUnit: 1200,
    });

    const response = await GET(new Request('http://localhost'), { params: { id: 'test-id' } });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).not.toHaveProperty('purchasePricePerLinearMeter');
    expect(data).not.toHaveProperty('purchasePricePerUnit');
  });
});
