import { z } from 'zod';

export const canopyRoofTypeSchema = z.enum(['SINGLE_SLOPE', 'DOUBLE_SLOPE', 'ARCH', 'SINGLE_SLOPE_CURVED']);

export const trussCalculationRequestSchema = z.object({
  canopyType: canopyRoofTypeSchema,
  width: z.number().min(2000).max(12000),
  length: z.number().min(2000).max(12000),
  ridgeHeight: z.number().min(1500).max(6000),
  wallHeight: z.number().min(1500).max(6000).optional(),
  trussSpacing: z.number().min(1500).max(3000),
  roofCoveringId: z.string().min(1),
  postProfileId: z.string().min(1),
  crossbeamProfileId: z.string().min(1),
  strutProfileId: z.string().min(1),
  archProfileId: z.string().min(1).optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.wallHeight !== undefined && (data.canopyType === 'SINGLE_SLOPE' || data.canopyType === 'SINGLE_SLOPE_CURVED')) {
      return data.wallHeight < data.ridgeHeight;
    }
    return true;
  },
  { message: 'Высота у низкой стены должна быть меньше высоты в коньке', path: ['wallHeight'] }
);

export const saveTrussCalculationSchema = z.object({
  canopyType: canopyRoofTypeSchema,
  width: z.number().min(2000).max(12000),
  length: z.number().min(2000).max(12000),
  ridgeHeight: z.number().min(1500).max(6000),
  wallHeight: z.number().min(1500).max(6000).optional(),
  trussSpacing: z.number().min(1500).max(3000),
  roofCoveringId: z.string().min(1),
  postProfileId: z.string().min(1),
  crossbeamProfileId: z.string().min(1),
  strutProfileId: z.string().min(1),
  archProfileId: z.string().min(1).optional().or(z.literal('')),
  name: z.string().max(200).optional(),
}).refine(
  (data) => {
    if (data.wallHeight !== undefined && (data.canopyType === 'SINGLE_SLOPE' || data.canopyType === 'SINGLE_SLOPE_CURVED')) {
      return data.wallHeight < data.ridgeHeight;
    }
    return true;
  },
  { message: 'Высота у низкой стены должна быть меньше высоты в коньке', path: ['wallHeight'] }
);

export const trussProfileCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['POST', 'CROSSBEAM', 'STRUT', 'ARCH']),
  sectionWidth: z.number().positive(),
  sectionHeight: z.number().positive(),
  wallThickness: z.number().positive(),
  length: z.number().positive().default(6.0),
  steelGrade: z.string().default('S235'),
  yieldStrength: z.number().positive().default(235),
  sectionArea: z.number().nonnegative(),
  momentOfInertiaX: z.number().nonnegative(),
  momentOfInertiaY: z.number().nonnegative(),
  sectionModulusX: z.number().nonnegative(),
  sectionModulusY: z.number().nonnegative(),
  radiusOfGyrationX: z.number().nonnegative(),
  radiusOfGyrationY: z.number().nonnegative(),
  weightPerMeter: z.number().nonnegative(),
  retailPricePerMeter: z.number().nonnegative().default(0),
  purchasePricePerMeter: z.number().nonnegative().optional(),
  retailPricePerUnit: z.number().nonnegative().default(0),
  purchasePricePerUnit: z.number().nonnegative().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  validFrom: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
});

export const trussRoofCoveringCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  weightPerSqm: z.number().positive(),
  thickness: z.number().positive().optional(),
  width: z.number().positive().optional(),
  usefulWidth: z.number().positive().optional(),
  standardLength: z.number().positive().optional(),
  coating: z.string().optional(),
  coatingType: z.string().optional(),
  color: z.string().optional(),
  retailPricePerSqm: z.number().positive(),
  purchasePricePerSqm: z.number().positive().optional(),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  priority: z.number().default(0),
  validFrom: z.string().optional().nullable(),
  expirationDate: z.string().optional().nullable(),
});
