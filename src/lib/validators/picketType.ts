import { z } from 'zod';

export const picketTypeBaseSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional(),
  metalThickness: z.number()
    .min(0.3, 'Толщина металла должна быть не менее 0.3 мм')
    .max(1.5, 'Толщина металла не должна превышать 1.5 мм'),
  width: z.number()
    .int('Ширина должна быть целым числом')
    .min(50, 'Ширина должна быть не менее 50 мм')
    .max(200, 'Ширина не должна превышать 200 мм'),
  length: z.number()
    .int('Длина должна быть целым числом')
    .min(500, 'Длина должна быть не менее 500 мм')
    .max(3000, 'Длина не должна превышать 3000 мм'),
  profileTypeId: z.string().min(1, 'Тип профиля обязателен'),
  coatingId: z.string().min(1, 'Покрытие обязательно'),
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

export const picketTypeSchema = picketTypeBaseSchema
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

export const picketTypeUpdateSchema = picketTypeBaseSchema.partial();

export type PicketTypeInput = z.infer<typeof picketTypeSchema>;
export type PicketTypeUpdate = z.infer<typeof picketTypeUpdateSchema>;
