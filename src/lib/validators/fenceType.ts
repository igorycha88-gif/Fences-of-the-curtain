import { z } from 'zod';

export const fenceTypeSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  description: z.string()
    .max(500, 'Описание не должно превышать 500 символов')
    .optional(),
  image: z.string().optional(),
  difficultyCoef: z.number()
    .min(0.5, 'Коэффициент сложности должен быть не менее 0.5')
    .max(3.0, 'Коэффициент сложности не должен превышать 3.0')
    .default(1.0),
  postSpacing: z.number()
    .min(1.5, 'Шаг установки столбов должен быть не менее 1.5 метров')
    .max(4.0, 'Шаг установки столбов не должен превышать 4.0 метров')
    .default(2.5),
  defaultLagRows: z.union([z.literal(2), z.literal(3)])
    .default(2),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const fenceTypeUpdateSchema = fenceTypeSchema.partial();

export type FenceTypeInput = z.infer<typeof fenceTypeSchema>;
export type FenceTypeUpdate = z.infer<typeof fenceTypeUpdateSchema>;
