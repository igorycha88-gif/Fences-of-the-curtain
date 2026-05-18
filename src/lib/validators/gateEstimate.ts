import { z } from 'zod';

const gateInputSchema = z.object({
  gateType: z.enum(['SWING', 'SLIDING']),
  gateWidth: z.number().min(2.0).max(6.0),
  hasAutomation: z.boolean().default(false),
  automationId: z.string().min(1).optional(),
});

const wicketInputSchema = z.object({
  wicketWidth: z.number().min(0.8).max(1.5),
});

export const gateEstimateSchema = z.object({
  height: z.number().min(1.5).max(3.0),
  needsInstallation: z.boolean().default(true),
  gates: z.array(gateInputSchema).max(2).default([]),
  wickets: z.array(wicketInputSchema).max(2).default([]),
}).refine(
  (data) => data.gates.length > 0 || data.wickets.length > 0,
  { message: 'Добавьте хотя бы одни ворота или одну калитку' }
).refine(
  (data) => data.gates.every(g => !g.hasAutomation || g.automationId),
  { message: 'При выборе автоматики необходимо указать тип автоматики' }
).refine(
  (data) => data.gates.every(g => !g.hasAutomation || g.gateType === 'SLIDING'),
  { message: 'Автоматика доступна только для откатных ворот' }
);

export type GateEstimateInput = z.infer<typeof gateEstimateSchema>;
