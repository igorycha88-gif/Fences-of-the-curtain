import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('@/lib/permissions/rbac', () => ({
  hasPermission: jest.fn(),
}));

import { getToken } from 'next-auth/jwt';
import { hasPermission } from '@/lib/permissions/rbac';
import { requireAuth, requirePermission, requireAdmin } from '@/lib/admin-auth';

const mockGetToken = getToken as jest.Mock;
const mockHasPermission = hasPermission as jest.Mock;

function createMockRequest() {
  return new NextRequest(new URL('http://localhost/api/test'));
}

describe('admin-auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return session when token is valid', async () => {
      mockGetToken.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
      });

      const result = await requireAuth(createMockRequest());

      expect(result).toEqual({
        session: {
          userId: 'user-1',
          email: 'admin@test.com',
          name: 'Admin',
          role: 'ADMIN',
        },
      });
    });

    it('should return 401 when token is missing', async () => {
      mockGetToken.mockResolvedValue(null);

      const result = await requireAuth(createMockRequest());

      expect(result).toBeInstanceOf(NextResponse);
      const response = result as NextResponse;
      expect(response.status).toBe(401);
    });

    it('should return 401 when token has no id', async () => {
      mockGetToken.mockResolvedValue({ email: 'test@test.com', role: 'ADMIN' });

      const result = await requireAuth(createMockRequest());

      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(401);
    });

    it('should return 401 when token has no role', async () => {
      mockGetToken.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });

      const result = await requireAuth(createMockRequest());

      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(401);
    });

    it('should return 401 when getToken throws', async () => {
      mockGetToken.mockRejectedValue(new Error('JWT error'));

      const result = await requireAuth(createMockRequest());

      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(401);
    });
  });

  describe('requirePermission', () => {
    it('should return true when role has permission', () => {
      mockHasPermission.mockReturnValue(true);

      const session = {
        userId: '1',
        email: 'admin@test.com',
        role: 'ADMIN' as any,
      };

      const result = requirePermission(session, 'orders');

      expect(result).toBe(true);
      expect(mockHasPermission).toHaveBeenCalledWith('ADMIN', 'orders');
    });

    it('should return 403 when role lacks permission', () => {
      mockHasPermission.mockReturnValue(false);

      const session = {
        userId: '1',
        email: 'content@test.com',
        role: 'CONTENT_MANAGER' as any,
      };

      const result = requirePermission(session, 'orders');

      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(403);
    });
  });

  describe('requireAdmin', () => {
    it('should return session when auth and permission pass', async () => {
      mockGetToken.mockResolvedValue({
        id: 'user-1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
      });
      mockHasPermission.mockReturnValue(true);

      const result = await requireAdmin(createMockRequest(), 'orders');

      expect(result).toEqual({
        session: {
          userId: 'user-1',
          email: 'admin@test.com',
          name: 'Admin',
          role: 'ADMIN',
        },
      });
    });

    it('should return 401 when auth fails', async () => {
      mockGetToken.mockResolvedValue(null);

      const result = await requireAdmin(createMockRequest(), 'orders');

      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(401);
    });

    it('should return 403 when permission fails', async () => {
      mockGetToken.mockResolvedValue({
        id: 'user-1',
        email: 'content@test.com',
        role: 'CONTENT_MANAGER',
      });
      mockHasPermission.mockReturnValue(false);

      const result = await requireAdmin(createMockRequest(), 'orders');

      expect(result).toBeInstanceOf(NextResponse);
      expect((result as NextResponse).status).toBe(403);
    });
  });
});
