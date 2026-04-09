import { z } from 'zod';

export const recalculateParamsSchema = z.object({
  length: z.number().min(1).max(1000).optional(),
  height: z.number().min(1.5).max(3.5).optional(),
  coating: z.enum(['GALVANIZED', 'POLYMER_SINGLE', 'POLYMER_DOUBLE']).optional(),
  lagRows: z.union([z.literal(2), z.literal(3)]).optional(),
  hasGate: z.boolean().optional(),
  gateType: z.enum(['SWING', 'SLIDING']).optional(),
  gateWidth: z.number().min(2).max(6).optional(),
  hasWicket: z.boolean().optional(),
  wicketWidth: z.number().min(0.8).max(1.5).optional(),
  picketProfileType: z.string().optional(),
  picketCoating: z.string().optional(),
  picketStep: z.number().min(1).max(20).optional(),
  picketMountingType: z.enum(['SINGLE', 'CHESS']).optional(),
});

export const addedItemSchema = z.object({
  category: z.string().min(1),
  nomenclatureId: z.string().min(1),
  nomenclatureName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  pricePerUnit: z.number().nonnegative(),
});

export const quantityOverrideSchema = z.object({
  nomenclatureId: z.string().min(1),
  quantity: z.number().positive(),
});

export const createAdminEstimateSchema = z.object({
  sourceEstimateId: z.string().min(1),
  editComment: z.string().max(500).optional(),
  parameters: recalculateParamsSchema.optional(),
  items: z.object({
    deleted: z.array(z.string()).optional(),
    added: z.array(addedItemSchema).optional(),
    quantityOverrides: z.array(quantityOverrideSchema).optional(),
  }),
});

export const updateAdminEstimateSchema = z.object({
  sourceEstimateId: z.string().min(1).optional(),
  editComment: z.string().max(500).optional(),
  parameters: recalculateParamsSchema.optional(),
  items: z.object({
    deleted: z.array(z.string()).optional(),
    added: z.array(addedItemSchema).optional(),
    quantityOverrides: z.array(quantityOverrideSchema).optional(),
  }),
});

export const recalculateEstimateSchema = z.object({
  estimateId: z.string().min(1),
  parameters: recalculateParamsSchema,
});

export type RecalculateParams = z.infer<typeof recalculateParamsSchema>;
export type AddedItem = z.infer<typeof addedItemSchema>;
export type QuantityOverride = z.infer<typeof quantityOverrideSchema>;
export type CreateAdminEstimateInput = z.infer<typeof createAdminEstimateSchema>;
export type UpdateAdminEstimateInput = z.infer<typeof updateAdminEstimateSchema>;
export type RecalculateEstimateInput = z.infer<typeof recalculateEstimateSchema>;
