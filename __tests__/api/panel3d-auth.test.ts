import { GET, POST } from '@/app/api/admin/panel3d/route';
import { NextRequest, NextResponse } from 'next/server';
import * as adminAuth from '@/lib/admin-auth';

jest.mock('@/services/admin/panel3dService', () => ({
  panel3dService: {
    getAll: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
    create: jest.fn().mockResolvedValue({ id: 'test-id', name: 'Test Panel' }),
  },
}));

jest.mock('@/lib/audit', () => ({
  createAuditLogAsync: jest.fn(),
}));

describe('Panel3D API - Authorization', () => {
  let mockReq: NextRequest;

  beforeEach(() => {
    mockReq = new NextRequest('http://localhost:3001/api/admin/panel3d', {
      method: 'GET',
    });
    jest.clearAllMocks();
  });

  describe('Unauthorized Access (No Session)', () => {
    it('GET should return 401 when no session', async () => {
      jest.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const response = await GET(mockReq);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('POST should return 401 when no session', async () => {
      const req = new NextRequest('http://localhost:3001/api/admin/panel3d', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Panel' }),
      });

      jest.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const response = await POST(req);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('Forbidden Access (Insufficient Role)', () => {
    it('GET should return 403 for CONTENT_MANAGER', async () => {
      jest.spyOn(adminAuth, 'requireAdmin').mockResolvedValue(
        NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      );

      const response = await GET(mockReq);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Forbidden');
    });

    it('POST should return 403 for CONTENT_MANAGER', async () => {
      const req = new NextRequest('http://localhost:3001/api/admin/panel3d', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Panel' }),
      });

      jest.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({
        session: {
          userId: 'user-id',
          email: 'user@example.com',
          role: 'CONTENT_MANAGER',
        },
      } as any);

      const response = await POST(req);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Forbidden - Insufficient permissions');
    });
  });

  describe('Authorized Access', () => {
    it('GET should allow ADMIN access', async () => {
      jest.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({
        session: {
          userId: 'admin-id',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      } as any);

      const response = await GET(mockReq);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('GET should allow MANAGER access', async () => {
      jest.spyOn(adminAuth, 'requireAdmin').mockResolvedValue({
        session: {
          userId: 'manager-id',
          email: 'manager@example.com',
          role: 'MANAGER',
        },
      } as any);

      const response = await GET(mockReq);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });
});
