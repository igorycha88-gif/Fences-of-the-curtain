import { z } from 'zod';

export const coatingTypeSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(100, 'Название не должно превышать 100 символов'),
  description: z.string()
    .max(300, 'Описание не должно превышать 300 символов')
    .optional(),
  baseCost: z.number()
    .min(0, 'Базовая стоимость должна быть не менее 0')
    .default(0),
  markupCoef: z.number()
    .min(1.0, 'Коэффициент наценки должен быть не менее 1.0')
    .max(3.0, 'Коэффициент наценки не должен превышать 3.0')
    .default(1.0),
  image: z.string().optional(),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const coatingTypeUpdateSchema = coatingTypeSchema.partial();

export type CoatingTypeInput = z.infer<typeof coatingTypeSchema>;
export type CoatingTypeUpdate = z.infer<typeof coatingTypeUpdateSchema>;
