import { z } from 'zod';

export const fenceEstimateSchema = z.object({
  fenceTypeId: z.string().min(1),
  length: z.number().min(1).max(1000),
  height: z.number().min(1.5).max(3.5),
  lagRows: z.union([z.literal(2), z.literal(3)]),
  coating: z.enum(['GALVANIZED', 'POLYMER_SINGLE', 'POLYMER_DOUBLE']).optional().default('POLYMER_SINGLE'),
  hasGate: z.boolean().optional().default(false),
  gateType: z.enum(['SWING', 'SLIDING']).optional(),
  gateWidth: z.number().min(2.0).max(6.0).optional(),
  hasWicket: z.boolean().optional().default(false),
  wicketWidth: z.number().min(0.8).max(1.5).optional(),
}).refine(
  (data) => !data.hasGate || (data.gateType && data.gateWidth),
  { message: "При выборе ворот необходимо указать тип и ширину" }
).refine(
  (data) => !data.hasWicket || data.wicketWidth,
  { message: "При выборе калитки необходимо указать ширину" }
);

export type FenceEstimateInput = z.infer<typeof fenceEstimateSchema>;
