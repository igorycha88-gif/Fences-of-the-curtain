import { z } from 'zod';

export const lengthOptionSchema = z.object({
  length: z.number()
    .min(1.5, 'Длина должна быть не менее 1.5 метров')
    .max(6.0, 'Длина не должна превышать 6.0 метров'),
  priceCoef: z.number()
    .min(0.5, 'Коэффициент цены должен быть не менее 0.5')
    .max(3.0, 'Коэффициент цены не должен превышать 3.0')
    .default(1.0),
});

export const lagTypeSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  description: z.string()
    .max(300, 'Описание не должно превышать 300 символов')
    .optional(),
  width: z.number()
    .min(20, 'Ширина сечения должна быть не менее 20 мм')
    .max(100, 'Ширина сечения не должна превышать 100 мм'),
  height: z.number()
    .min(20, 'Высота сечения должна быть не менее 20 мм')
    .max(100, 'Высота сечения не должна превышать 100 мм'),
  metalThickness: z.number()
    .min(1.0, 'Толщина металла должна быть не менее 1.0 мм')
    .max(5.0, 'Толщина металла не должна превышать 5.0 мм'),
  basePricePerMeter: z.number()
    .min(0, 'Базовая цена должна быть не менее 0'),
  availableLengths: z.array(lengthOptionSchema).optional(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const lagTypeUpdateSchema = lagTypeSchema.partial();

export type LengthOption = z.infer<typeof lengthOptionSchema>;
export type LagTypeInput = z.infer<typeof lagTypeSchema>;
export type LagTypeUpdate = z.infer<typeof lagTypeUpdateSchema>;
