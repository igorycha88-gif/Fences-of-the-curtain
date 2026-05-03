import { z } from 'zod';

const automationTypeBaseSchema = z.object({
  name: z.string()
    .min(2, 'Название должно содержать минимум 2 символа')
    .max(200, 'Название не должно превышать 200 символов'),
  description: z.string()
    .max(1000, 'Описание не должно превышать 1000 символов')
    .optional(),
  retailPrice: z.number()
    .min(0, 'Розничная стоимость должна быть не менее 0'),
  purchasePrice: z.number()
    .min(0, 'Цена закупки должна быть не менее 0')
    .nullable()
    .optional(),
  image: z.string().optional(),
  active: z.boolean().default(true),
  validFrom: z.coerce.date().nullable().optional(),
  expirationDate: z.coerce.date().nullable().optional(),
  priority: z.number().int().min(0).default(0),
});

export const automationTypeSchema = automationTypeBaseSchema.refine(
  (data) => {
    if (data.validFrom && data.expirationDate) {
      return data.validFrom < data.expirationDate;
    }
    return true;
  },
  {
    message: 'Дата окончания должна быть позже даты начала',
    path: ['expirationDate'],
  }
);

export const automationTypeUpdateSchema = automationTypeBaseSchema.partial();

export type AutomationTypeInput = z.infer<typeof automationTypeSchema>;
export type AutomationTypeUpdate = z.infer<typeof automationTypeUpdateSchema>;
