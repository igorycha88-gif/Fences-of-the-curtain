import { z } from 'zod';

const postTypeBaseSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  description: z.string()
    .max(300, 'Описание не должно превышать 300 символов')
    .optional(),
  sectionWidth: z.number()
    .min(40, 'Ширина сечения должна быть не менее 40 мм')
    .max(120, 'Ширина сечения не должна превышать 120 мм'),
  sectionHeight: z.number()
    .min(40, 'Высота сечения должна быть не менее 40 мм')
    .max(120, 'Высота сечения не должна превышать 120 мм'),
  wallThickness: z.number()
    .min(1.5, 'Толщина стенки должна быть не менее 1.5 мм')
    .max(5.0, 'Толщина стенки не должна превышать 5.0 мм'),
  length: z.number()
    .min(1.5, 'Длина должна быть не менее 1.5 метров')
    .max(6.0, 'Длина не должна превышать 6.0 метров'),
  retailPricePerUnit: z.number()
    .min(0, 'Розничная цена за единицу должна быть не менее 0'),
  purchasePricePerUnit: z.number()
    .min(0, 'Закупочная цена за единицу должна быть не менее 0')
    .nullable()
    .optional(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  forMesh: z.boolean().default(false),
  validFrom: z.coerce.date().nullable().optional(),
  expirationDate: z.coerce.date().nullable().optional(),
  confirmDuplicate: z.boolean().optional(),
  updateExistingExpiration: z.string().optional(),
});

export const postTypeSchema = postTypeBaseSchema.refine(
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

export const postTypeUpdateSchema = postTypeBaseSchema.partial();

export type PostTypeInput = z.infer<typeof postTypeSchema>;
export type PostTypeUpdate = z.infer<typeof postTypeUpdateSchema>;
