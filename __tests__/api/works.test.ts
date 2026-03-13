import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    work: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    workRelation: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    referenceChangeLog: {
      create: jest.fn(),
    },
});

jest.mock('@/app/api/admin/works/route', () => ({
  POST: jest.fn(),
  GET: jest.fn(),

  describe('POST /api/admin/works', () => {
    it('should create work successfully', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = {
        id: 'work-1',
        name: 'Монтаж забора',
        category: 'MOUNTING',
        unit: 'M',
        price: 500.00,
        useInCalculator: true,
        sortOrder: 0,
        active: true,
        relations: [],
      };

      prisma.work.create.mockResolvedValue(mockWork);
      prisma.workRelation.createMany.mockResolvedValue({ count: 0 });
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const request = new Request('http://localhost:3000/api/admin/works', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Монтаж забора',
          category: 'MOUNTING',
          unit: 'M',
          price: 500.00,
          useInCalculator: true,
          sortOrder: 0,
          active: true,
          relations: [],
        }),
      });

      const response = await POST(request);

      expect(prisma.work.create).toHaveBeenCalled();
      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ id: 'work-1' });
    });

    it('should return 401 for unauthorized', async () => {
      const request = new Request('http://localhost:3000/api/admin/works', {
        method: 'POST',
        body: JSON.stringify({ name: 'Тест' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });

    it('should return 403 for non-admin', async () => {
      const mockSession = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'MANAGER',
        },
      };
      
      jest.mocked('@/lib/auth').getServerSession.mockResolvedValue(mockSession);

      const request = new Request('http://localhost:3000/api/admin/works', {
        method: 'POST',
        body: JSON.stringify({ name: 'Тест' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: 'Forbidden' });
    });

    it('should return 400 for validation error', async () => {
      const request = new Request('http://localhost:3000/api/admin/works', {
        method: 'POST',
        body: JSON.stringify({
          name: 'A',
          category: 'MOUNTING',
          unit: 'M',
          price: -100,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/works', () => {
    it('should return works with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWorks = [
        {
          id: 'work-1',
          name: 'Монтаж забора',
          category: 'MOUNTING',
          unit: 'M',
          price: 500.00,
          active: true,
          relations: [],
        },
      ];

      prisma.work.findMany.mockResolvedValue(mockWorks);
      prisma.work.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/admin/works?page=1&pageSize=20');
      const response = await GET(request);

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });

      expect(prisma.work.count).toHaveBeenCalledWith({});
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        items: expect.arrayContaining({
          ...mockWorks[0],
          categoryName: 'Монтаж',
          unitName: 'м',
          relations: [],
        }),
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
    });

    it('should filter by search', async () => {
      const { prisma } = require('@/lib/prisma');
      
      const request = new Request('http://localhost:3000/api/admin/works?search=забор');
      const response = await GET(request);

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'забор', mode: 'insensitive' } },
            { description: { contains: 'забор', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 20,
        orderBy: { sortOrder: 'asc' },
        include: { relations: true },
      });
      expect(response.status).toBe(200);
    });

    it('should return 401 for unauthorized', async () => {
      const request = new Request('http://localhost:3000/api/admin/works');
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('PUT /api/admin/works/:id', () => {
    it('should update work successfully', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockOldWork = {
        id: 'work-1',
        name: 'Старое название',
      };
      const mockUpdatedWork = {
        id: 'work-1',
        name: 'Новое название',
      };

      prisma.work.findUnique.mockResolvedValue(mockOldWork);
      prisma.workRelation.deleteMany.mockResolvedValue({ count: 1 });
      prisma.workRelation.createMany.mockResolvedValue({ count: 2 });
      prisma.work.update.mockResolvedValue(mockUpdatedWork);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const request = new Request('http://localhost:3000/api/admin/works/work-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Новое название',
          price: 600.00,
          relations: [
            { fenceType: 'PICKET' },
          ],
        }),
      });

      const response = await PUT(request);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        include: { relations: true },
      });

      expect(prisma.workRelation.deleteMany).toHaveBeenCalledWith({
        where: { workId: 'work-1' },
      });

      expect(prisma.workRelation.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { workId: 'work-1', fenceType: 'PICKET' },
        ]),
      });

      expect(prisma.work.update).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        data: {
          name: 'Новое название',
          price: 600.00,
        },
        include: { relations: true },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
    });

    it('should return 404 for non-existent work', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.work.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/works/non-existent');
      const response = await PUT(request);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
        include: { relations: true },
      });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Работа не найдена' });
    });
  });

  describe('DELETE /api/admin/works/:id', () => {
    it('should delete work successfully', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = {
        id: 'work-1',
        name: 'Монтаж забора',
      };

      prisma.work.findUnique.mockResolvedValue(mockWork);
      prisma.work.delete.mockResolvedValue(mockWork);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const request = new Request('http://localhost:3000/api/admin/works/work-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
      });

      expect(prisma.work.delete).toHaveBeenCalledWith({
        where: { id: 'work-1' },
      });

      expect(prisma.referenceChangeLog.create).toHaveBeenCalledWith({
        data: {
          entityType: 'Work',
          entityId: 'work-1',
          fieldName: 'deleted',
          oldValue: { id: 'work-1', name: 'Монтаж забора' },
          newValue: undefined,
          changedBy: mockUserId,
        },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
    });

    it('should return 404 for non-existent work', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.work.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/works/non-existent');
      const response = await DELETE(request);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Работа не найдена' });
    });
  });

  describe('PATCH /api/admin/works/:id (toggle active)', () => {
    it('should toggle active status successfully', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWork = {
        id: 'work-1',
        name: 'Монтаж забора',
        active: true,
      };
      const mockUpdatedWork = {
        id: 'work-1',
        name: 'Монтаж забора',
        active: false,
      };

      prisma.work.findUnique.mockResolvedValue(mockWork);
      prisma.work.update.mockResolvedValue(mockUpdatedWork);
      prisma.referenceChangeLog.create.mockResolvedValue({});

      const request = new Request('http://localhost:3000/api/admin/works/work-1', {
        method: 'PATCH',
      });

      const response = await PATCH(request);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
      });

      expect(prisma.work.update).toHaveBeenCalledWith({
        where: { id: 'work-1' },
        data: { active: false },
      });

      expect(prisma.referenceChangeLog.create).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockUpdatedWork);
    });

    it('should return 404 for non-existent work', async () => {
      const { prisma } = require('@/lib/prisma');
      
      prisma.work.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/works/work-1', {
        method: 'PATCH',
      });

      const response = await PATCH(request);

      expect(prisma.work.findUnique).toHaveBeenCalledWith({
        where: { id: 'work-1' },
      });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Работа не найдена' });
    });
  });

  describe('GET /api/admin/works/fence-types', () => {
    it('should return fence types', async () => {
      const request = new Request('http://localhost:3000/api/admin/works/fence-types');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([
        { value: 'PROFNASTIL', label: 'Профнастил' },
        { value: 'PICKET', label: 'Евроштакетник' },
        { value: 'GATE', label: 'Ворота' },
        { value: 'WICKET', label: 'Калитки' },
      ]);
    });
  });

  describe('GET /api/admin/works/by-fence-type', () => {
    it('should return works by fence type', async () => {
      const { prisma } = require('@/lib/prisma');
      const mockWorks = [
        {
          id: 'work-1',
          name: 'Монтаж забора',
          category: 'MOUNTING',
          unit: 'M',
          price: 500.00,
          useInCalculator: true,
        },
      ];

      prisma.work.findMany.mockResolvedValue(mockWorks);

      const request = new Request('http://localhost:3000/api/admin/works/by-fence-type?fenceType=PROFNASTIL');
      const response = await GET(request);

      expect(prisma.work.findMany).toHaveBeenCalledWith({
        where: {
          active: true,
          useInCalculator: true,
          relations: {
            some: { fenceType: 'PROFNASTIL' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        items: expect.arrayContaining({
          ...mockWorks[0],
          categoryName: 'Монтаж',
          unitName: 'м',
        }),
        total: 1,
      });
    });
  });
  });
});
