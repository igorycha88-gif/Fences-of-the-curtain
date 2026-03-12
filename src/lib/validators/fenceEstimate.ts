import { z } from 'zod';

export const fenceEstimateSchema = z.object({
  fenceTypeId: z.string().min(1),
  length: z.number().min(1).max(1000),
  height: z.number().min(1.5).max(3.5),
  lagRows: z.union([z.literal(2), z.literal(3)]),
});

export type FenceEstimateInput = z.infer<typeof fenceEstimateSchema>;
