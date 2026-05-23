import { z } from 'zod';

const markupBaseSchema = z.object({
  minLength: z.number()
    .min(0, 'Минимальная длина должна быть не менее 0')
    .max(10000, 'Минимальная длина не должна превышать 10000 м'),
  maxLength: z.number()
    .min(0, 'Максимальная длина должна быть не менее 0')
    .max(10000, 'Максимальная длина не должна превышать 10000 м'),
  markupPercent: z.number()
    .min(0, 'Процент надбавки должен быть не менее 0')
    .max(500, 'Процент надбавки не должен превышать 500'),
  active: z.boolean().default(true),
  priority: z.number().int().default(0),
});

export const fenceLengthMarkupSchema = markupBaseSchema.refine((data) => data.maxLength > data.minLength, {
  message: 'Максимальная длина должна быть больше минимальной',
  path: ['maxLength'],
});

export const fenceLengthMarkupUpdateSchema = markupBaseSchema.partial().refine(
  (data) => {
    if (data.minLength !== undefined && data.maxLength !== undefined) {
      return data.maxLength > data.minLength;
    }
    return true;
  },
  {
    message: 'Максимальная длина должна быть больше минимальной',
    path: ['maxLength'],
  }
);

export type FenceLengthMarkupInput = z.infer<typeof fenceLengthMarkupSchema>;
export type FenceLengthMarkupUpdate = z.infer<typeof fenceLengthMarkupUpdateSchema>;
