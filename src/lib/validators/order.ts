import { z } from 'zod';

export const multiEstimateOrderSchema = z.object({
  clientName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  phone: z.string().regex(/^\+7\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}$/, 'Формат: +7 (XXX) XXX-XX-XX'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  message: z.string().max(1000).optional(),
  multiEstimateId: z.string().min(1, 'ID мульти-расчета обязателен'),
  isMultiEstimate: z.literal(true),
});

export const createOrderSchema = z.object({
  clientName: z.string().min(2, 'Имя должно содержать минимум 2 символа').max(100),
  phone: z.string().regex(/^\+7\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}$/, 'Формат: +7 (XXX) XXX-XX-XX'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  message: z.string().max(1000).optional(),
});

export const fenceParametersSchema = z.object({
  fenceTypeId: z.string(),
  fenceTypeName: z.string(),
  length: z.number().min(1),
  height: z.number().min(1),
  coating: z.string().optional(),
  hasGate: z.boolean().optional(),
  gateType: z.string().optional(),
  gateWidth: z.number().optional(),
  hasWicket: z.boolean().optional(),
  wicketWidth: z.number().optional(),
  lagRows: z.number().optional(),
  picketProfileType: z.string().optional(),
  picketCoating: z.string().optional(),
  picketStep: z.number().optional(),
  picketMountingType: z.string().optional(),
});

export const individualOrderSchema = z.object({
  clientName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  phone: z.string().regex(/^\+7\s*\(\d{3}\)\s*\d{3}-\d{2}-\d{2}$/, 'Формат: +7 (XXX) XXX-XX-XX'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  message: z.string().max(1000, 'Комментарий не более 1000 символов').optional().or(z.literal('')),
  isIndividualRequest: z.literal(true),
  fenceParameters: fenceParametersSchema,
});

export type FenceParameters = z.infer<typeof fenceParametersSchema>;
export type IndividualOrderRequest = z.infer<typeof individualOrderSchema>;

export const ORDER_STATUSES = [
  'NEW',
  'ESTIMATE_APPROVAL',
  'MEASUREMENT',
  'PRODUCTION',
  'INSTALLATION',
  'COMPLETED',
  'CANCELLED',
] as const;

export const CONTACT_RESULTS = [
  'REACHED',
  'CALLBACK',
  'NO_ANSWER',
  'LEFT_MESSAGE',
] as const;

export const CANCELLATION_REASONS = [
  'PRICE_TOO_HIGH',
  'FOUND_OTHER_CONTRACTOR',
  'CHANGED_MIND',
  'NOT_RESPONSIVE',
  'PROJECT_POSTPONED',
  'OTHER',
] as const;

export const CONTACT_RESULT_LABELS: Record<string, string> = {
  REACHED: 'Дозвонились',
  CALLBACK: 'Перезвонить позже',
  NO_ANSWER: 'Не ответили',
  LEFT_MESSAGE: 'Оставили сообщение',
};

export const CANCELLATION_REASON_LABELS: Record<string, string> = {
  PRICE_TOO_HIGH: 'Цена слишком высокая',
  FOUND_OTHER_CONTRACTOR: 'Выбрали другого подрядчика',
  CHANGED_MIND: 'Передумал',
  NOT_RESPONSIVE: 'Клиент не выходит на связь',
  PROJECT_POSTPONED: 'Проект отложен',
  OTHER: 'Другое',
};

export const estimateApprovalDataSchema = z.object({
  contactResult: z.enum(CONTACT_RESULTS).optional(),
  preferredContactDate: z.string().optional(),
});

export const measurementDataSchema = z.object({
  measurementDate: z.string().optional(),
  measurementAddress: z.string().min(10, 'Адрес должен содержать минимум 10 символов'),
  measurementComment: z.string().optional(),
});

export const productionDataSchema = z.object({
  measurementConfirmed: z.boolean().optional(),
  measurementResult: z.string().min(10, 'Результат замера должен содержать минимум 10 символов').optional().or(z.literal('')),
  adjustedCost: z.number().positive().optional(),
});

export const installationDataSchema = z.object({
  productionReadyDate: z.string().optional(),
  productionNotes: z.string().optional(),
});

export const completedDataSchema = z.object({
  completionDate: z.string().optional(),
  clientSatisfied: z.boolean().optional(),
  photos: z.array(z.string()).optional(),
  reviewLink: z.string().optional(),
});

export const cancelledDataSchema = z.object({
  cancellationReason: z.enum(CANCELLATION_REASONS),
  cancellationComment: z.string().min(10, 'Комментарий должен содержать минимум 10 символов'),
});

export const statusChangeDataSchema = z.object({
  contactResult: z.enum(CONTACT_RESULTS).optional(),
  preferredContactDate: z.string().optional(),
  measurementDate: z.string().optional(),
  measurementAddress: z.string().optional(),
  measurementComment: z.string().optional(),
  measurementConfirmed: z.boolean().optional(),
  measurementResult: z.string().optional(),
  adjustedCost: z.number().positive().optional(),
  productionReadyDate: z.string().optional(),
  productionNotes: z.string().optional(),
  completionDate: z.string().optional(),
  clientSatisfied: z.boolean().optional(),
  photos: z.array(z.string()).optional(),
  reviewLink: z.string().optional(),
  cancellationReason: z.enum(CANCELLATION_REASONS).optional(),
  cancellationComment: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  data: statusChangeDataSchema.optional(),
  comment: z.string().max(500).optional(),
});

export const statusHistoryUpdateSchema = z.object({
  data: statusChangeDataSchema.partial(),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
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

export function getStatusTransitionSchema(fromStatus: string, toStatus: string) {
  const transitionKey = `${fromStatus}->${toStatus}`;
  
  switch (transitionKey) {
    case 'NEW->ESTIMATE_APPROVAL':
      return estimateApprovalDataSchema;
    case 'ESTIMATE_APPROVAL->MEASUREMENT':
      return measurementDataSchema;
    case 'MEASUREMENT->PRODUCTION':
      return productionDataSchema;
    case 'PRODUCTION->INSTALLATION':
      return installationDataSchema;
    case 'INSTALLATION->COMPLETED':
      return completedDataSchema;
    default:
      if (toStatus === 'CANCELLED') {
        return cancelledDataSchema;
      }
      return z.object({});
  }
}

export type OrderStatus = typeof ORDER_STATUSES[number];
export type ContactResult = typeof CONTACT_RESULTS[number];
export type CancellationReason = typeof CANCELLATION_REASONS[number];
export type StatusChangeData = z.infer<typeof statusChangeDataSchema>;
export type StatusHistoryEntry = {
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
  changedByName: string;
  data: StatusChangeData;
  editedAt?: string;
  editedBy?: string;
};
