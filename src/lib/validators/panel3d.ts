import { z } from 'zod';

const panel3dBaseSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional(),
  panelHeight: z.number()
    .min(500, 'Высота панели должна быть не менее 500 мм')
    .max(3000, 'Высота панели не должна превышать 3000 мм'),
  panelWidth: z.number()
    .min(500, 'Ширина панели должна быть не менее 500 мм')
    .max(3000, 'Ширина панели не должна превышать 3000 мм'),
  rodDiameter: z.number()
    .min(2, 'Диаметр прутка должен быть не менее 2 мм')
    .max(6, 'Диаметр прутка не должен превышать 6 мм'),
  cellWidth: z.number()
    .min(20, 'Ширина ячейки должна быть не менее 20 мм')
    .max(200, 'Ширина ячейки не должна превышать 200 мм'),
  cellHeight: z.number()
    .min(20, 'Высота ячейки должна быть не менее 20 мм')
    .max(200, 'Высота ячейки не должна превышать 200 мм'),
  purchasePricePerUnit: z.number()
    .min(0, 'Закупочная цена должна быть не менее 0')
    .max(100000, 'Закупочная цена не должна превышать 100 000 ₽')
    .nullable()
    .optional(),
  retailPricePerUnit: z.number()
    .min(0, 'Розничная цена должна быть не менее 0')
    .max(100000, 'Розничная цена не должна превышать 100 000 ₽'),
  validFrom: z.coerce.date().nullable().optional(),
  validUntil: z.coerce.date().nullable().optional(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  priority: z.number()
    .int('Приоритет должен быть целым числом')
    .min(0, 'Приоритет должен быть не менее 0')
    .max(100, 'Приоритет не должен превышать 100')
    .default(0),
});

export const panel3dSchema = panel3dBaseSchema
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

export const panel3dUpdateSchema = panel3dBaseSchema.partial();

export type Panel3dInput = z.infer<typeof panel3dSchema>;
export type Panel3dUpdate = z.infer<typeof panel3dUpdateSchema>;
