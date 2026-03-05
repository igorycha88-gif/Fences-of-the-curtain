import { z } from 'zod';

export const postLengthOptionSchema = z.object({
  length: z.number()
    .min(1.5, 'Длина должна быть не менее 1.5 метров')
    .max(5.0, 'Длина не должна превышать 5.0 метров'),
  pricePerMeter: z.number()
    .min(0, 'Цена за метр должна быть не менее 0'),
  priceWithConcrete: z.number()
    .min(0, 'Цена с бетонированием должна быть не менее 0')
    .optional(),
});

export const postTypeSchema = z.object({
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
  pricePerMeter: z.number()
    .min(0, 'Цена за метр должна быть не менее 0'),
  priceWithConcrete: z.number()
    .min(0, 'Цена с бетонированием должна быть не менее 0')
    .optional(),
  availableLengths: z.array(postLengthOptionSchema).optional(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const postTypeUpdateSchema = postTypeSchema.partial();

export type PostLengthOption = z.infer<typeof postLengthOptionSchema>;
export type PostTypeInput = z.infer<typeof postTypeSchema>;
export type PostTypeUpdate = z.infer<typeof postTypeUpdateSchema>;
