import { z } from 'zod';

export const createOrderSchema = z.object({
  clientName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  phone: z.string().regex(/^\+7\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}$/, 'Формат: +7 (XXX) XXX-XX-XX'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  message: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'ESTIMATE_APPROVAL',
    'MEASUREMENT',
    'PRODUCTION',
    'INSTALLATION',
    'COMPLETED',
    'CANCELLED',
  ]),
  comment: z.string().max(500).optional(),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.enum([
    'NEW',
    'ESTIMATE_APPROVAL',
    'MEASUREMENT',
    'PRODUCTION',
    'INSTALLATION',
    'COMPLETED',
    'CANCELLED',
  ]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
});

export const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новая',
  ESTIMATE_APPROVAL: 'Согласование сметы',
  MEASUREMENT: 'Замер',
  PRODUCTION: 'Производство',
  INSTALLATION: 'Монтаж',
  COMPLETED: 'Выполнена',
  CANCELLED: 'Отменена',
};

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['ESTIMATE_APPROVAL', 'CANCELLED'],
  ESTIMATE_APPROVAL: ['MEASUREMENT', 'CANCELLED'],
  MEASUREMENT: ['PRODUCTION', 'CANCELLED'],
  PRODUCTION: ['INSTALLATION', 'CANCELLED'],
  INSTALLATION: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function isValidStatusTransition(from: string, to: string): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
