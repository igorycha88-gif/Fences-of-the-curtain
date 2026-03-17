import {
  estimateApprovalDataSchema,
  measurementDataSchema,
  productionDataSchema,
  installationDataSchema,
  completedDataSchema,
  cancelledDataSchema,
  isValidStatusTransition,
  getStatusTransitionSchema,
  STATUS_LABELS,
  CONTACT_RESULT_LABELS,
  CANCELLATION_REASON_LABELS,
} from '@/lib/validators/order';

describe('Order Validators', () => {
  describe('estimateApprovalDataSchema', () => {
    it('should validate valid estimate approval data', () => {
      const data = {
        contactResult: 'REACHED',
        preferredContactDate: '2026-03-18',
      };
      expect(() => estimateApprovalDataSchema.parse(data)).not.toThrow();
    });

    it('should allow empty data', () => {
      expect(() => estimateApprovalDataSchema.parse({})).not.toThrow();
    });

    it('should reject invalid contactResult', () => {
      const data = {
        contactResult: 'INVALID',
      };
      expect(() => estimateApprovalDataSchema.parse(data)).toThrow();
    });
  });

  describe('measurementDataSchema', () => {
    it('should validate valid measurement data', () => {
      const data = {
        measurementDate: '2026-03-20',
        measurementAddress: 'г. Москва, ул. Ленина, д. 10',
        measurementComment: 'Дом за забором',
      };
      expect(() => measurementDataSchema.parse(data)).not.toThrow();
    });

    it('should require measurementAddress with min 10 chars', () => {
      const data = {
        measurementAddress: 'короткий',
      };
      expect(() => measurementDataSchema.parse(data)).toThrow();
    });

    it('should accept valid measurementAddress', () => {
      const data = {
        measurementAddress: 'г. Москва, ул. Ленина, д. 10',
      };
      expect(() => measurementDataSchema.parse(data)).not.toThrow();
    });
  });

  describe('productionDataSchema', () => {
    it('should validate valid production data', () => {
      const data = {
        measurementConfirmed: true,
        measurementResult: 'Замер проведен успешно',
        adjustedCost: 150000,
      };
      expect(() => productionDataSchema.parse(data)).not.toThrow();
    });

    it('should allow empty data', () => {
      expect(() => productionDataSchema.parse({})).not.toThrow();
    });

    it('should reject measurementResult with less than 10 chars', () => {
      const data = {
        measurementResult: 'короткий',
      };
      expect(() => productionDataSchema.parse(data)).toThrow();
    });

    it('should reject negative adjustedCost', () => {
      const data = {
        adjustedCost: -100,
      };
      expect(() => productionDataSchema.parse(data)).toThrow();
    });
  });

  describe('installationDataSchema', () => {
    it('should validate valid installation data', () => {
      const data = {
        productionReadyDate: '2026-03-25',
        productionNotes: 'Готово к монтажу',
      };
      expect(() => installationDataSchema.parse(data)).not.toThrow();
    });

    it('should allow empty data', () => {
      expect(() => installationDataSchema.parse({})).not.toThrow();
    });
  });

  describe('completedDataSchema', () => {
    it('should validate valid completed data', () => {
      const data = {
        completionDate: '2026-03-30',
        clientSatisfied: true,
        photos: ['https://example.com/photo1.jpg'],
        reviewLink: 'https://example.com/review',
      };
      expect(() => completedDataSchema.parse(data)).not.toThrow();
    });

    it('should allow empty data', () => {
      expect(() => completedDataSchema.parse({})).not.toThrow();
    });
  });

  describe('cancelledDataSchema', () => {
    it('should validate valid cancelled data', () => {
      const data = {
        cancellationReason: 'PRICE_TOO_HIGH',
        cancellationComment: 'Клиент нашел подрядчика на 30% дешевле',
      };
      expect(() => cancelledDataSchema.parse(data)).not.toThrow();
    });

    it('should require cancellationReason', () => {
      const data = {
        cancellationComment: 'Причина не указана',
      };
      expect(() => cancelledDataSchema.parse(data)).toThrow();
    });

    it('should require cancellationComment with min 10 chars', () => {
      const data = {
        cancellationReason: 'OTHER',
        cancellationComment: 'короткий',
      };
      expect(() => cancelledDataSchema.parse(data)).toThrow();
    });

    it('should reject invalid cancellationReason', () => {
      const data = {
        cancellationReason: 'INVALID',
        cancellationComment: 'Комментарий',
      };
      expect(() => cancelledDataSchema.parse(data)).toThrow();
    });
  });

  describe('isValidStatusTransition', () => {
    it('should return true for valid transitions', () => {
      expect(isValidStatusTransition('NEW', 'ESTIMATE_APPROVAL')).toBe(true);
      expect(isValidStatusTransition('ESTIMATE_APPROVAL', 'MEASUREMENT')).toBe(true);
      expect(isValidStatusTransition('MEASUREMENT', 'PRODUCTION')).toBe(true);
      expect(isValidStatusTransition('PRODUCTION', 'INSTALLATION')).toBe(true);
      expect(isValidStatusTransition('INSTALLATION', 'COMPLETED')).toBe(true);
    });

    it('should return true for cancellation from any status', () => {
      expect(isValidStatusTransition('NEW', 'CANCELLED')).toBe(true);
      expect(isValidStatusTransition('ESTIMATE_APPROVAL', 'CANCELLED')).toBe(true);
      expect(isValidStatusTransition('MEASUREMENT', 'CANCELLED')).toBe(true);
      expect(isValidStatusTransition('PRODUCTION', 'CANCELLED')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(isValidStatusTransition('NEW', 'PRODUCTION')).toBe(false);
      expect(isValidStatusTransition('NEW', 'COMPLETED')).toBe(false);
      expect(isValidStatusTransition('COMPLETED', 'NEW')).toBe(false);
      expect(isValidStatusTransition('CANCELLED', 'NEW')).toBe(false);
    });
  });

  describe('getStatusTransitionSchema', () => {
    it('should return correct schema for NEW -> ESTIMATE_APPROVAL', () => {
      const schema = getStatusTransitionSchema('NEW', 'ESTIMATE_APPROVAL');
      expect(schema).toBe(estimateApprovalDataSchema);
    });

    it('should return correct schema for ESTIMATE_APPROVAL -> MEASUREMENT', () => {
      const schema = getStatusTransitionSchema('ESTIMATE_APPROVAL', 'MEASUREMENT');
      expect(schema).toBe(measurementDataSchema);
    });

    it('should return correct schema for MEASUREMENT -> PRODUCTION', () => {
      const schema = getStatusTransitionSchema('MEASUREMENT', 'PRODUCTION');
      expect(schema).toBe(productionDataSchema);
    });

    it('should return correct schema for PRODUCTION -> INSTALLATION', () => {
      const schema = getStatusTransitionSchema('PRODUCTION', 'INSTALLATION');
      expect(schema).toBe(installationDataSchema);
    });

    it('should return correct schema for INSTALLATION -> COMPLETED', () => {
      const schema = getStatusTransitionSchema('INSTALLATION', 'COMPLETED');
      expect(schema).toBe(completedDataSchema);
    });

    it('should return cancelledDataSchema for any -> CANCELLED', () => {
      const schema1 = getStatusTransitionSchema('NEW', 'CANCELLED');
      const schema2 = getStatusTransitionSchema('PRODUCTION', 'CANCELLED');
      expect(schema1).toBe(cancelledDataSchema);
      expect(schema2).toBe(cancelledDataSchema);
    });

    it('should return empty schema for unknown transitions', () => {
      const schema = getStatusTransitionSchema('UNKNOWN', 'UNKNOWN');
      expect(schema).toBeDefined();
    });
  });

  describe('Labels', () => {
    it('should have all status labels', () => {
      expect(STATUS_LABELS.NEW).toBe('Новая');
      expect(STATUS_LABELS.ESTIMATE_APPROVAL).toBe('Согласование сметы');
      expect(STATUS_LABELS.MEASUREMENT).toBe('Замер');
      expect(STATUS_LABELS.PRODUCTION).toBe('Производство');
      expect(STATUS_LABELS.INSTALLATION).toBe('Монтаж');
      expect(STATUS_LABELS.COMPLETED).toBe('Выполнена');
      expect(STATUS_LABELS.CANCELLED).toBe('Отменена');
    });

    it('should have all contact result labels', () => {
      expect(CONTACT_RESULT_LABELS.REACHED).toBe('Дозвонились');
      expect(CONTACT_RESULT_LABELS.CALLBACK).toBe('Перезвонить позже');
      expect(CONTACT_RESULT_LABELS.NO_ANSWER).toBe('Не ответили');
      expect(CONTACT_RESULT_LABELS.LEFT_MESSAGE).toBe('Оставили сообщение');
    });

    it('should have all cancellation reason labels', () => {
      expect(CANCELLATION_REASON_LABELS.PRICE_TOO_HIGH).toBe('Цена слишком высокая');
      expect(CANCELLATION_REASON_LABELS.FOUND_OTHER_CONTRACTOR).toBe('Выбрали другого подрядчика');
      expect(CANCELLATION_REASON_LABELS.CHANGED_MIND).toBe('Передумал');
      expect(CANCELLATION_REASON_LABELS.NOT_RESPONSIVE).toBe('Клиент не выходит на связь');
      expect(CANCELLATION_REASON_LABELS.PROJECT_POSTPONED).toBe('Проект отложен');
      expect(CANCELLATION_REASON_LABELS.OTHER).toBe('Другое');
    });
  });
});
