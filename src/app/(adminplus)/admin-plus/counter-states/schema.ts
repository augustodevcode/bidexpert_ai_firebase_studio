/**
 * @fileoverview Schema Zod para CounterState — Admin Plus.
 * Campos: entityType (string, required), currentValue (int, default 0).
 */
import { z } from 'zod';

export const counterStateSchema = z.object({
  entityType: z.string().min(1, 'Tipo de entidade é obrigatório'),
  currentValue: z.number().int().default(0),
});

export type CounterStateFormValues = z.infer<typeof counterStateSchema>;
