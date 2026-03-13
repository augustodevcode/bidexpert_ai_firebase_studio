/**
 * @fileoverview Schemas Zod para validação de DataSources no Admin Plus.
 */
import { z } from 'zod';

export const createDataSourceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(150),
  modelName: z.string().min(2, 'Nome do model deve ter pelo menos 2 caracteres').max(100),
  fields: z.string().min(2, 'Defina ao menos um campo').refine(
    (val) => {
      try { JSON.parse(val); return true; } catch { return false; }
    },
    { message: 'JSON inválido' },
  ),
});

export const updateDataSourceSchema = createDataSourceSchema.partial();

export type CreateDataSourceInput = z.infer<typeof createDataSourceSchema>;
export type UpdateDataSourceInput = z.infer<typeof updateDataSourceSchema>;
