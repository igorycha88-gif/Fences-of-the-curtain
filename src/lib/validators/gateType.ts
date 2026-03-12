import { z } from 'zod';

const gateTypeBaseSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional(),
  type: z.enum(['Распашные', 'Откатные'], {
    errorMap: () => ({ message: 'Тип должен быть "Распашные" или "Откатные"' })
  }),
  metalThickness: z.number()
    .min(1.0, 'Толщина металла должна быть не менее 1.0 мм')
    .max(5.0, 'Толщина металла не должна превышать 5.0 мм'),
  sectionWidth: z.number()
    .min(20, 'Ширина сечения должна быть не менее 20 мм')
    .max(200, 'Ширина сечения не должна превышать 200 мм'),
  sectionHeight: z.number()
    .min(20, 'Высота сечения должна быть не менее 20 мм')
    .max(200, 'Высота сечения не должна превышать 200 мм'),
  gateHeight: z.number()
    .min(500, 'Высота ворот должна быть не менее 500 мм')
    .max(3000, 'Высота ворот не должна превышать 3000 мм'),
  gateLength: z.number()
    .min(500, 'Длина должна быть не менее 500 мм')
    .max(6000, 'Длина не должна превышать 6000 мм'),
  retailPrice: z.number()
    .min(0, 'Розничная стоимость должна быть не менее 0'),
  purchasePrice: z.number()
    .min(0, 'Цена закупки должна быть не менее 0')
    .nullable()
    .optional(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  validFrom: z.coerce.date().nullable().optional(),
  expirationDate: z.coerce.date().nullable().optional(),
});

export const gateTypeSchema = gateTypeBaseSchema.refine(
  (data) => {
    if (data.validFrom && data.expirationDate) {
      return data.validFrom < data.expirationDate;
    }
    return true;
  },
  {
    message: 'Дата окончания должна быть позже даты начала',
    path: ['expirationDate'],
  }
);

export const gateTypeUpdateSchema = gateTypeBaseSchema.partial();

export type GateTypeInput = z.infer<typeof gateTypeSchema>;
export type GateTypeUpdate = z.infer<typeof gateTypeUpdateSchema>;
