import { z } from 'zod';

const meshBaseSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional(),
  height: z.number()
    .min(500, 'Высота сетки должна быть не менее 500 мм')
    .max(4000, 'Высота сетки не должна превышать 4000 мм'),
  cellSize: z.number()
    .min(10, 'Размер ячейки должен быть не менее 10 мм')
    .max(100, 'Размер ячейки не должен превышать 100 мм'),
  wireThickness: z.number()
    .min(0.5, 'Толщина прутка должна быть не менее 0.5 мм')
    .max(10, 'Толщина прутка не должна превышать 10 мм'),
  coating: z.string()
    .min(1, 'Укажите тип покрытия'),
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

export const meshSchema = meshBaseSchema
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

export const meshUpdateSchema = meshBaseSchema.partial();

export type MeshInput = z.infer<typeof meshSchema>;
export type MeshUpdate = z.infer<typeof meshUpdateSchema>;
