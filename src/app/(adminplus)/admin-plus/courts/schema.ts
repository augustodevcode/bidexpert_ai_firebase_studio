/**
 * @fileoverview Schemas Zod para validação de Comarcas/Tribunais no Admin Plus.
 */
import { z } from 'zod';

export const createCourtSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
  stateUf: z
    .string()
    .length(2, 'UF deve ter exatamente 2 caracteres')
    .transform((v) => v.toUpperCase()),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const updateCourtSchema = createCourtSchema.partial();

export type CreateCourtInput = z.infer<typeof createCourtSchema>;
export type UpdateCourtInput = z.infer<typeof updateCourtSchema>;
