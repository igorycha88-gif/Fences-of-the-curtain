import { GET, POST } from '@/app/api/admin/panel3d/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

jest.mock('next-auth');
jest.mock('@/services/admin/panel3dService');
jest.mock('@/lib/audit');

describe('Panel3D API - Authorization', () => {
  let mockReq: NextRequest;

  beforeEach(() => {
    mockReq = new NextRequest('http://localhost:3001/api/admin/panel3d', {
      method: 'GET',
    });
    jest.clearAllMocks();
  });

  describe('Unauthorized Access (No Session)', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
    });

    it('GET should return 401 when no session', async () => {
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

      const response = await POST(req);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('Forbidden Access (Insufficient Role)', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: 'CONTENT_MANAGER',
        },
      });
    });

    it('GET should return 403 for CONTENT_MANAGER', async () => {
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

      const response = await POST(req);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error).toBe('Forbidden - Insufficient permissions');
    });
  });

  describe('Authorized Access', () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'admin-id',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      });
    });

    it('GET should allow ADMIN access', async () => {
      const response = await GET(mockReq);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });

    it('GET should allow MANAGER access', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'manager-id',
          email: 'manager@example.com',
          role: 'MANAGER',
        },
      });

      const response = await GET(mockReq);
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });
});
