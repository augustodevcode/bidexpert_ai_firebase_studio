/**
 * @fileoverview Schema Zod para VariableIncrementRule — Admin Plus.
 * Campos: from (number), to (number nullable), increment (number).
 */
import { z } from 'zod';

export const variableIncrementRuleSchema = z.object({
  from: z.number({ required_error: 'Valor "De" é obrigatório' }),
  to: z.number().nullable().optional(),
  increment: z.number({ required_error: 'Incremento é obrigatório' }),
});

export type VariableIncrementRuleFormValues = z.infer<typeof variableIncrementRuleSchema>;
