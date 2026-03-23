import { z } from 'zod';

export const ReferenceTypeEnum = z.enum(['LAG', 'POST', 'PROFNASTIL', 'PICKET', 'GATE', 'WICKET', 'PANEL_3D']);

export const CalculationMethodEnum = z.enum(['BY_QUANTITY', 'BY_LENGTH', 'BY_AREA', 'BY_RATIO', 'BY_INVERSE_RATIO']);

export const mountingHardwareRelationSchema = z.object({
  referenceType: ReferenceTypeEnum,
  referenceId: z.string().min(1, 'Необходимо выбрать позицию'),
});

const mountingHardwareBaseSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional()
    .nullable(),
  purchasePrice: z.number({
    required_error: 'Цена закупки обязательна для заполнения',
    invalid_type_error: 'Цена закупки должна быть числом',
  })
    .min(0, 'Цена закупки должна быть не менее 0')
    .nullable(),
  retailPrice: z.number()
    .min(0, 'Розничная стоимость должна быть не менее 0'),
  validUntil: z.coerce.date().nullable().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  useInCalculator: z.boolean().default(false),
  calculationMethod: CalculationMethodEnum.nullable().optional(),
  calculationValue: z.number().positive('Значение должно быть больше 0').nullable().optional(),
  relations: z.array(mountingHardwareRelationSchema)
    .min(1, 'Необходимо указать хотя бы одну связь'),
});

export const mountingHardwareSchema = mountingHardwareBaseSchema.refine(
  (data) => {
    if (data.useInCalculator) {
      if (!data.calculationMethod) {
        return false;
      }
      if (['BY_LENGTH', 'BY_AREA', 'BY_RATIO'].includes(data.calculationMethod)) {
        return data.calculationValue !== null && data.calculationValue !== undefined && data.calculationValue > 0;
      }
      if (data.calculationMethod === 'BY_INVERSE_RATIO') {
        const n = data.calculationValue;
        return n !== null && n !== undefined && Number.isInteger(n) && n >= 1 && n <= 10000;
      }
    }
    return true;
  },
  {
    message: 'При использовании в калькуляторе необходимо указать метод расчёта и значение',
    path: ['calculationMethod'],
  }
);

export const mountingHardwareUpdateSchema = mountingHardwareBaseSchema.partial().extend({
  relations: z.array(mountingHardwareRelationSchema).optional(),
}).refine(
  (data) => {
    if (data.useInCalculator && data.calculationMethod) {
      if (['BY_LENGTH', 'BY_AREA', 'BY_RATIO'].includes(data.calculationMethod)) {
        return data.calculationValue !== null && data.calculationValue !== undefined && data.calculationValue > 0;
      }
      if (data.calculationMethod === 'BY_INVERSE_RATIO') {
        const n = data.calculationValue;
        return n !== null && n !== undefined && Number.isInteger(n) && n >= 1 && n <= 10000;
      }
    }
    return true;
  },
  {
    message: 'При использовании в калькуляторе необходимо указать значение для выбранного метода расчёта',
    path: ['calculationValue'],
  }
);

export type MountingHardwareInput = z.infer<typeof mountingHardwareSchema>;
export type MountingHardwareUpdate = z.infer<typeof mountingHardwareUpdateSchema>;
export type MountingHardwareRelationInput = z.infer<typeof mountingHardwareRelationSchema>;
export type ReferenceType = z.infer<typeof ReferenceTypeEnum>;
export type CalculationMethod = z.infer<typeof CalculationMethodEnum>;
