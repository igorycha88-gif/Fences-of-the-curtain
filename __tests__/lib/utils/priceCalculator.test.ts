import { describe, it, expect } from '@jest/globals';
import {
  hasPermission,
  requirePermission,
  canDelete,
  canCreate,
  canUpdate,
  PERMISSIONS,
} from '@/lib/permissions/rbac';

describe('RBAC Permissions', () => {
  describe('hasPermission', () => {
    it('should grant all permissions to ADMIN', () => {
      for (const perm of Object.values(PERMISSIONS)) {
        expect(hasPermission('ADMIN', perm)).toBe(true);
      }
    });

    it('should grant MANAGER specific permissions', () => {
      expect(hasPermission('MANAGER', PERMISSIONS.DASHBOARD)).toBe(true);
      expect(hasPermission('MANAGER', PERMISSIONS.MATERIALS)).toBe(true);
      expect(hasPermission('MANAGER', PERMISSIONS.ORDERS)).toBe(true);
      expect(hasPermission('MANAGER', PERMISSIONS.PRICES)).toBe(true);
      expect(hasPermission('MANAGER', PERMISSIONS.STATISTICS)).toBe(true);
    });

    it('should deny MANAGER content and users permissions', () => {
      expect(hasPermission('MANAGER', PERMISSIONS.CONTENT)).toBe(false);
      expect(hasPermission('MANAGER', PERMISSIONS.USERS)).toBe(false);
    });

    it('should grant CONTENT_MANAGER dashboard and content', () => {
      expect(hasPermission('CONTENT_MANAGER', PERMISSIONS.DASHBOARD)).toBe(true);
      expect(hasPermission('CONTENT_MANAGER', PERMISSIONS.CONTENT)).toBe(true);
    });

    it('should deny CONTENT_MANAGER most permissions', () => {
      expect(hasPermission('CONTENT_MANAGER', PERMISSIONS.MATERIALS)).toBe(false);
      expect(hasPermission('CONTENT_MANAGER', PERMISSIONS.ORDERS)).toBe(false);
      expect(hasPermission('CONTENT_MANAGER', PERMISSIONS.PRICES)).toBe(false);
      expect(hasPermission('CONTENT_MANAGER', PERMISSIONS.USERS)).toBe(false);
      expect(hasPermission('CONTENT_MANAGER', PERMISSIONS.STATISTICS)).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw for authorized role', () => {
      expect(() => requirePermission('ADMIN', PERMISSIONS.USERS)).not.toThrow();
    });

    it('should throw for unauthorized role', () => {
      expect(() => requirePermission('CONTENT_MANAGER', PERMISSIONS.USERS)).toThrow('Access denied');
    });

    it('should throw for MANAGER accessing users', () => {
      expect(() => requirePermission('MANAGER', PERMISSIONS.USERS)).toThrow('Access denied');
    });
  });

  describe('canDelete', () => {
    it('should allow delete for ADMIN only', () => {
      expect(canDelete('ADMIN')).toBe(true);
      expect(canDelete('MANAGER')).toBe(false);
      expect(canDelete('CONTENT_MANAGER')).toBe(false);
    });
  });

  describe('canCreate', () => {
    it('should allow ADMIN to create anything', () => {
      for (const perm of Object.values(PERMISSIONS)) {
        expect(canCreate('ADMIN', perm)).toBe(true);
      }
    });

    it('should allow MANAGER to create materials and orders', () => {
      expect(canCreate('MANAGER', PERMISSIONS.MATERIALS)).toBe(true);
      expect(canCreate('MANAGER', PERMISSIONS.ORDERS)).toBe(true);
    });

    it('should deny MANAGER to create content', () => {
      expect(canCreate('MANAGER', PERMISSIONS.CONTENT)).toBe(false);
    });

    it('should allow CONTENT_MANAGER to create content', () => {
      expect(canCreate('CONTENT_MANAGER', PERMISSIONS.CONTENT)).toBe(true);
    });

    it('should deny CONTENT_MANAGER to create materials', () => {
      expect(canCreate('CONTENT_MANAGER', PERMISSIONS.MATERIALS)).toBe(false);
    });
  });

  describe('canUpdate', () => {
    it('should mirror canCreate for all roles', () => {
      for (const perm of Object.values(PERMISSIONS)) {
        expect(canUpdate('ADMIN', perm)).toBe(canCreate('ADMIN', perm));
        expect(canUpdate('MANAGER', perm)).toBe(canCreate('MANAGER', perm));
        expect(canUpdate('CONTENT_MANAGER', perm)).toBe(canCreate('CONTENT_MANAGER', perm));
      }
    });
  });
});
