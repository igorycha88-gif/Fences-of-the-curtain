import { z } from 'zod';
import { fenceEstimateSchema } from './fenceEstimate';

export const multiFenceEstimateSchema = z.object({
  estimates: z
    .array(fenceEstimateSchema)
    .min(1, 'Необходим хотя бы один расчет')
    .max(10, 'Максимум 10 расчетов'),
});

export type MultiFenceEstimateInput = z.infer<typeof multiFenceEstimateSchema>;
