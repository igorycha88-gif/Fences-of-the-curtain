import { z } from 'zod';
import { WorkCategory, WorkUnit } from '../enums/work';

const relationSchema = z.object({
  fenceType: z.string().optional(),
  referenceType: z.enum(['GATE', 'WICKET', 'PANEL_3D']).optional(),
  referenceId: z.string().optional(),
}).refine(
  (data) => data.fenceType || (data.referenceType && data.referenceId),
  { message: 'Необходимо указать либо fenceType, либо referenceType + referenceId' }
);

export const createWorkSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа').max(200, 'Название должно содержать максимум 200 символов'),
  description: z.string().max(1000, 'Описание должно содержать максимум 1000 символов').optional(),
  category: z.enum(['MOUNTING', 'DELIVERY', 'ADDITIONAL', 'MEASUREMENT'], {
    required_error: 'Категория обязательна',
    invalid_type_error: 'Некорректная категория',
  }),
  unit: z.enum(['M', 'KM', 'PCS', 'FIXED', 'M2'], {
    required_error: 'Единица измерения обязательна',
    invalid_type_error: 'Некорректная единица измерения',
  }),
  price: z.number().min(0, 'Стоимость должна быть положительным числом или нулём'),
  useInCalculator: z.boolean().default(false),
  sortOrder: z.number().default(0),
  active: z.boolean().default(true),
  relations: z.array(relationSchema).optional(),
});

export const updateWorkSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional(),
  category: z.enum(['MOUNTING', 'DELIVERY', 'ADDITIONAL', 'MEASUREMENT']).optional(),
  unit: z.enum(['M', 'KM', 'PCS', 'FIXED', 'M2']).optional(),
  price: z.number().min(0).optional(),
  useInCalculator: z.boolean().optional(),
  sortOrder: z.number().optional(),
  active: z.boolean().optional(),
  relations: z.array(relationSchema).optional(),
});

export const workQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(['MOUNTING', 'DELIVERY', 'ADDITIONAL', 'MEASUREMENT']).optional(),
  active: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  useInCalculator: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  fenceType: z.string().optional(),
  referenceType: z.enum(['GATE', 'WICKET', 'PANEL_3D']).optional(),
  referenceId: z.string().optional(),
});

export type CreateWorkInput = z.infer<typeof createWorkSchema>;
export type UpdateWorkInput = z.infer<typeof updateWorkSchema>;
export type WorkQueryInput = z.infer<typeof workQuerySchema>;
export type WorkRelationInput = z.infer<typeof relationSchema>;
