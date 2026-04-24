import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/audit', () => ({
  createAuditLogAsync: jest.fn<any>().mockResolvedValue(undefined),
}));

import { createAuditLogAsync } from '@/lib/audit';
import { logPriceChange } from '@/lib/audit-helpers';

const mockCreateAuditLog = createAuditLogAsync as jest.Mock<any>;

describe('audit-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logPriceChange', () => {
    it('should create audit log when price field changes', () => {
      logPriceChange(
        'PostType',
        'post-1',
        { retailPricePerUnit: 100, name: 'Столб' },
        { retailPricePerUnit: 150, name: 'Столб' },
        'user-1'
      );

      expect(mockCreateAuditLog).toHaveBeenCalledWith({
        userId: 'user-1',
        action: 'UPDATE_PRICE',
        entityType: 'PostType',
        entityId: 'post-1',
        oldValues: { retailPricePerUnit: 100 },
        newValues: { retailPricePerUnit: 150 },
      });
    });

    it('should not create audit log when no price field changes', () => {
      logPriceChange(
        'PostType',
        'post-1',
        { retailPricePerUnit: 100, name: 'Столб' },
        { retailPricePerUnit: 100, name: 'Столб новый' },
        'user-1'
      );

      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it('should not create audit log when no fields change at all', () => {
      logPriceChange(
        'PostType',
        'post-1',
        { retailPricePerUnit: 100 },
        { retailPricePerUnit: 100 },
        'user-1'
      );

      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it('should detect multiple price field changes', () => {
      logPriceChange(
        'PostType',
        'post-1',
        { retailPricePerUnit: 100, purchasePricePerUnit: 50, pricePerMeter: 200 },
        { retailPricePerUnit: 150, purchasePricePerUnit: 60, pricePerMeter: 200 },
        'user-1'
      );

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValues: { retailPricePerUnit: 100, purchasePricePerUnit: 50 },
          newValues: { retailPricePerUnit: 150, purchasePricePerUnit: 60 },
        })
      );
    });

    it('should handle unknown entity type (no price fields)', () => {
      logPriceChange(
        'UnknownType',
        'id-1',
        { price: 100 },
        { price: 200 },
        'user-1'
      );

      expect(mockCreateAuditLog).not.toHaveBeenCalled();
    });

    it('should handle GateType price fields', () => {
      logPriceChange(
        'GateType',
        'gate-1',
        { retailPrice: 15000, purchasePrice: 10000 },
        { retailPrice: 18000, purchasePrice: 10000 },
        'user-1'
      );

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValues: { retailPrice: 15000 },
          newValues: { retailPrice: 18000 },
        })
      );
    });

    it('should handle Work price field', () => {
      logPriceChange(
        'Work',
        'work-1',
        { price: 500 },
        { price: 600 },
        'user-1'
      );

      expect(mockCreateAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValues: { price: 500 },
          newValues: { price: 600 },
        })
      );
    });
  });
});
