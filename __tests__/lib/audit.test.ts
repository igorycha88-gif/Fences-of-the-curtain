import { createAuditLog, createAuditLogAsync, getSystemUserId, resetSystemUserIdCache, AuditLogParams } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as any;

jest.mock('next/headers', () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue('test-user-agent'),
  }),
}));

jest.mock('@/lib/utils', () => ({
  getClientIPFromHeaders: jest.fn().mockReturnValue('192.168.1.1'),
}));

describe('Audit Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    resetSystemUserIdCache();
  });

  describe('getSystemUserId', () => {
    it('should return cached system user ID on subsequent calls', async () => {
      const mockUserId = 'system-user-id';
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
      });

      const result1 = await getSystemUserId();
      const result2 = await getSystemUserId();

      expect(result1).toBe(mockUserId);
      expect(result2).toBe(mockUserId);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should create system user if not exists', async () => {
      const mockUserId = 'new-system-user-id';
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: mockUserId,
      });

      const result = await getSystemUserId();

      expect(result).toBe(mockUserId);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'system@fences.local',
          name: 'Система',
          password: 'system_internal_disabled',
          role: 'ADMIN',
          phone: '+70000000000',
          active: false,
        },
        select: { id: true },
      });
    });
  });

  describe('createAuditLog', () => {
    it('should create audit log entry with all fields', async () => {
      const params: AuditLogParams = {
        userId: 'user-123',
        action: 'CREATE_ORDER',
        entityType: 'Order',
        entityId: 'order-456',
        oldValues: null,
        newValues: { clientName: 'Test Client' },
        details: { additionalInfo: 'test' },
      };

      await createAuditLog(params);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          action: 'CREATE_ORDER',
          entityType: 'Order',
          entityId: 'order-456',
          oldValues: undefined,
          newValues: { clientName: 'Test Client' },
          details: { additionalInfo: 'test' },
          ipAddress: '192.168.1.1',
          userAgent: 'test-user-agent',
        },
      });
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockPrisma.auditLog.create.mockRejectedValueOnce(new Error('DB Error'));

      const params: AuditLogParams = {
        userId: 'user-123',
        action: 'TEST_ACTION',
      };

      await createAuditLog(params);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUDIT_ERROR] Failed to create audit log:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createAuditLogAsync', () => {
    it('should call createAuditLog via setImmediate', (done) => {
      const params: AuditLogParams = {
        userId: 'user-123',
        action: 'ASYNC_TEST',
      };

      createAuditLogAsync(params);

      setImmediate(() => {
        expect(mockPrisma.auditLog.create).toHaveBeenCalled();
        done();
      });
    });
  });
});
