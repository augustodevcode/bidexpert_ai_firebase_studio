/**
 * @fileoverview Zod schemas para validação de Estado (State) no Admin Plus.
 */
import { z } from 'zod';

export const createStateSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  uf: z
    .string()
    .length(2, 'UF deve ter exatamente 2 caracteres')
    .transform((v) => v.toUpperCase()),
});

export const updateStateSchema = createStateSchema.partial();

export type CreateStateInput = z.infer<typeof createStateSchema>;
export type UpdateStateInput = z.infer<typeof updateStateSchema>;
