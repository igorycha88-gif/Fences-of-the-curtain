import { z } from 'zod';

export const fenceTypesQuerySchema = z.object({
  onlyWithMaterials: z.coerce.boolean().optional().default(false),
});

export const fenceCalculatorSchema = z.object({
  fenceTypeId: z.string().min(1),
  length: z.number().min(10).max(1000),
  height: z.number().min(1.5).max(3.5),
  postType: z.string().min(1),
  lagType: z.string().min(1),
  lagRows: z.union([z.literal(2), z.literal(3)]),
  hasGate: z.boolean(),
  gateType: z.enum(['SWING', 'SLIDING']).optional(),
  gateWidth: z.number().min(2).max(6).optional(),
  hasWicket: z.boolean(),
  wicketWidth: z.number().min(0.8).max(1.2).optional(),
  coating: z.enum(['GALVANIZED', 'POLYMER_SINGLE', 'POLYMER_DOUBLE']),
  color: z.string().optional(),
  region: z.string().optional(),
  difficultyCoef: z.number().optional(),
  postSpacing: z.number().optional(),
}).refine((data) => {
  if (data.hasGate && (!data.gateType || !data.gateWidth)) {
    return false;
  }
  if (data.hasWicket && !data.wicketWidth) {
    return false;
  }
  return true;
}, {
  message: 'Заполните все обязательные поля для ворот и калитки',
  path: ['gateType', 'gateWidth', 'wicketWidth'],
});

export const canopyCalculatorSchema = z.object({
  canopyType: z.enum(['single-slope', 'double-slope', 'arch']),
  purpose: z.enum(['car-1', 'car-2', 'car-3', 'gazebo', 'terrace', 'storage']),
  length: z.number().min(3).max(50),
  width: z.number().min(2).max(20),
  height: z.number().min(2).max(6),
  frameMaterial: z.string().min(1),
  roofMaterial: z.string().min(1),
  installationType: z.enum(['ground', 'wall', 'base']),
  hasWaterSystem: z.boolean(),
});

export const orderSchema = z.object({
  clientName: z.string().min(2).max(100),
  phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
  email: z.string().email().optional().or(z.literal('')),
  serviceType: z.enum(['fence', 'canopy']),
  parameters: z.any(),
  calculatedCost: z.number().min(0),
});

export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +7XXXXXXXXXX'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().min(5).max(1000),
});

export function validateLength(length: number | ''): string | null {
  if (length === '' || length === null || length === undefined) {
    return 'Укажите длину забора в метрах';
  }
  const num = Number(length);
  if (isNaN(num)) {
    return 'Введите числовое значение';
  }
  if (num < 10) {
    return 'Минимальная длина — 10 м';
  }
  if (num > 1000) {
    return 'Максимальная длина — 1 000 м';
  }
  return null;
}

export function validateHeight(height: number | ''): string | null {
  if (height === '' || height === null || height === undefined) {
    return 'Укажите высоту забора в метрах';
  }
  const num = Number(height);
  if (isNaN(num)) {
    return 'Введите числовое значение';
  }
  if (num < 1.5) {
    return 'Минимальная высота — 1.5 м';
  }
  if (num > 3.5) {
    return 'Максимальная высота — 3.5 м';
  }
  return null;
}
