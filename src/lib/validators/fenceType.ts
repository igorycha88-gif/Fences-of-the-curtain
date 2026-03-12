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
    .int('Шаг установки столбов должен быть целым числом')
    .min(1000, 'Шаг установки столбов должен быть не менее 1000 мм')
    .max(5000, 'Шаг установки столбов не должен превышать 5000 мм')
    .default(2500),
  defaultLagRows: z.union([z.literal(2), z.literal(3)])
    .default(2),
  active: z.boolean().default(true),
  priority: z.number().int().default(0),
});

export const fenceTypeUpdateSchema = fenceTypeSchema.partial();

export type FenceTypeInput = z.infer<typeof fenceTypeSchema>;
export type FenceTypeUpdate = z.infer<typeof fenceTypeUpdateSchema>;
