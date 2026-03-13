import { z } from 'zod';

export const COATING_TYPES = ['Полимерное (одностороннее)', 'Полимерное (двустороннее)', 'Оцинковка'] as const;

const profnastilTypeBaseSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional(),
  metalThickness: z.number()
    .min(0.3, 'Толщина металла должна быть не менее 0.3 мм')
    .max(1.5, 'Толщина металла не должна превышать 1.5 мм'),
  fullWidth: z.number()
    .int('Полная ширина должна быть целым числом')
    .min(500, 'Полная ширина должна быть не менее 500 мм')
    .max(1500, 'Полная ширина не должна превышать 1500 мм'),
  usefulWidth: z.number()
    .int('Полезная ширина должна быть целым числом')
    .min(400, 'Полезная ширина должна быть не менее 400 мм')
    .max(1400, 'Полезная ширина не должна превышать 1400 мм'),
  length: z.number()
    .int('Длина должна быть целым числом')
    .min(500, 'Длина должна быть не менее 500 мм')
    .max(12000, 'Длина не должна превышать 12000 мм'),
  coating: z.enum(COATING_TYPES, {
    errorMap: () => ({ message: 'Недопустимое покрытие' }),
  }),
  color: z.string()
    .max(50, 'Цвет не должен превышать 50 символов')
    .optional(),
  purchasePricePerUnit: z.number()
    .min(0, 'Цена закупки должна быть не менее 0')
    .nullable()
    .optional(),
  retailPricePerUnit: z.number()
    .min(0, 'Розничная стоимость должна быть не менее 0'),
  validFrom: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const profnastilTypeSchema = profnastilTypeBaseSchema
  .refine(
    (data) => data.usefulWidth <= data.fullWidth,
    {
      message: 'Полезная ширина не может превышать полную',
      path: ['usefulWidth'],
    }
  )
  .refine(
    (data) => {
      if (data.validFrom && data.validUntil) {
        return data.validFrom < data.validUntil;
      }
      return true;
    },
    {
      message: 'Срок действия должен быть позже даты начала',
      path: ['validUntil'],
    }
  );

export const profnastilTypeUpdateSchema = profnastilTypeBaseSchema.partial();

export type ProfnastilTypeInput = z.infer<typeof profnastilTypeSchema>;
export type ProfnastilTypeUpdate = z.infer<typeof profnastilTypeUpdateSchema>;
