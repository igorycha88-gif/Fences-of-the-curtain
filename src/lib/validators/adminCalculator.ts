import { z } from 'zod';

export const adminCalculatorInputSchema = z.object({
  fenceTypeId: z.string().min(1),
  length: z.number().min(1).max(1000),
  height: z.number().min(1.5).max(3.5),
  lagRows: z.union([z.literal(2), z.literal(3)]).optional(),
  coating: z.enum(['GALVANIZED', 'POLYMER_SINGLE', 'POLYMER_DOUBLE']).default('POLYMER_SINGLE'),
  hasGate: z.boolean().default(false),
  gateType: z.enum(['SWING', 'SLIDING']).optional(),
  gateWidth: z.number().min(2.0).max(6.0).optional(),
  hasWicket: z.boolean().default(false),
  wicketWidth: z.number().min(0.8).max(1.5).optional(),
  picketProfileType: z.string().optional(),
  picketCoating: z.string().optional(),
  picketStep: z.number().min(1).max(20).optional(),
  picketMountingType: z.enum(['SINGLE', 'CHESS']).optional(),
  meshCellSize: z.number().min(10).max(100).optional(),
  meshWireThickness: z.number().min(0.5).max(10).optional(),
  meshCoating: z.enum(['GALVANIZED', 'POLYMER']).optional(),
  hasAutomation: z.boolean().default(false),
  automationId: z.string().optional(),
}).refine(
  (data) => !data.hasGate || (data.gateType && data.gateWidth),
  { message: "При выборе ворот необходимо указать тип и ширину" }
).refine(
  (data) => !data.hasWicket || data.wicketWidth,
  { message: "При выборе калитки необходимо указать ширину" }
);

export const adminUpdateEstimateItemsSchema = z.object({
  items: z.array(z.object({
    nomenclatureId: z.string().min(1),
    nomenclatureName: z.string().min(1),
    category: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    pricePerUnit: z.number().nonnegative(),
    purchasePrice: z.number().nullable().optional(),
    isDeleted: z.boolean().optional(),
    isAdded: z.boolean().optional(),
    autoQuantity: z.number().optional(),
  })),
  editComment: z.string().max(500).optional(),
});

export const adminAddItemSchema = z.object({
  nomenclatureId: z.string().min(1),
  category: z.string().min(1),
  nomenclatureName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  pricePerUnit: z.number().nonnegative(),
  purchasePrice: z.number().nullable().optional(),
});

export const adminCreateOrderSchema = z.object({
  estimateId: z.string().min(1),
  multiEstimateId: z.string().optional(),
  clientName: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  phone: z.string().min(1, 'Телефон обязателен'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  comment: z.string().max(1000).optional(),
});

export const adminMultiEstimateSchema = z.object({
  estimates: z.array(adminCalculatorInputSchema).min(1).max(10),
});

export type AdminCalculatorInput = z.infer<typeof adminCalculatorInputSchema>;
export type AdminUpdateEstimateItems = z.infer<typeof adminUpdateEstimateItemsSchema>;
export type AdminAddItem = z.infer<typeof adminAddItemSchema>;
export type AdminCreateOrder = z.infer<typeof adminCreateOrderSchema>;
export type AdminMultiEstimateInput = z.infer<typeof adminMultiEstimateSchema>;
