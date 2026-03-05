import { z } from 'zod';

export const heightOptionSchema = z.object({
  height: z.number()
    .min(1.0, 'Высота должна быть не менее 1.0 метра')
    .max(5.0, 'Высота не должна превышать 5.0 метров'),
  priceCoef: z.number()
    .min(0.5, 'Коэффициент цены должен быть не менее 0.5')
    .max(3.0, 'Коэффициент цены не должен превышать 3.0')
    .default(1.0),
  isCustom: z.boolean().default(false),
  comment: z.string()
    .max(200, 'Комментарий не должен превышать 200 символов')
    .optional(),
});

export const fenceHeightSchema = z.object({
  materialId: z.string().min(1, 'ID материала обязателен'),
  height: z.number()
    .min(1.0, 'Высота должна быть не менее 1.0 метра')
    .max(5.0, 'Высота не должна превышать 5.0 метров'),
  priceCoef: z.number()
    .min(0.5, 'Коэффициент цены должен быть не менее 0.5')
    .max(3.0, 'Коэффициент цены не должен превышать 3.0')
    .default(1.0),
  isCustom: z.boolean().default(false),
  comment: z.string()
    .max(200, 'Комментарий не должен превышать 200 символов')
    .optional(),
});

export const fenceHeightUpdateSchema = z.object({
  priceCoef: z.number()
    .min(0.5, 'Коэффициент цены должен быть не менее 0.5')
    .max(3.0, 'Коэффициент цены не должен превышать 3.0')
    .optional(),
  comment: z.string()
    .max(200, 'Комментарий не должен превышать 200 символов')
    .optional(),
});

export type HeightOption = z.infer<typeof heightOptionSchema>;
export type FenceHeightInput = z.infer<typeof fenceHeightSchema>;
export type FenceHeightUpdate = z.infer<typeof fenceHeightUpdateSchema>;
