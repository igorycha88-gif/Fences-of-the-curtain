import { z } from 'zod';

export const portfolioInputSchema = z.object({
  title: z.string()
    .min(1, 'Название обязательно')
    .max(255, 'Максимум 255 символов'),
  category: z.enum(['fence', 'canopy'], {
    errorMap: () => ({ message: 'Выберите категорию' }),
  }),
  type: z.string()
    .max(100, 'Максимум 100 символов')
    .optional(),
  description: z.string()
    .max(2000, 'Максимум 2000 символов')
    .optional(),
  images: z.array(z.string())
    .min(1, 'Минимум 1 изображение')
    .max(5, 'Максимум 5 изображений'),
  cost: z.number()
    .min(0, 'Стоимость не может быть отрицательной')
    .optional(),
  showCost: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
});

export const portfolioUpdateSchema = portfolioInputSchema.partial();

export const portfolioListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
  category: z.enum(['fence', 'canopy']).optional(),
  active: z.coerce.boolean().optional(),
});

export const bulkOperationSchema = z.object({
  ids: z.array(z.string())
    .min(1, 'Выберите хотя бы один элемент')
    .max(50, 'Максимум 50 элементов за раз'),
});

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    sortOrder: z.number().int().min(0),
  })).min(1, 'Минимум один элемент'),
});

export type PortfolioInput = z.infer<typeof portfolioInputSchema>;
export type PortfolioUpdate = z.infer<typeof portfolioUpdateSchema>;
export type PortfolioListParams = z.infer<typeof portfolioListParamsSchema>;
export type BulkOperationRequest = z.infer<typeof bulkOperationSchema>;
export type ReorderRequest = z.infer<typeof reorderSchema>;
