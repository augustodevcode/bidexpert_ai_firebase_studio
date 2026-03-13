/**
 * @fileoverview Schema Zod para validação de Role no Admin Plus.
 */
import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  permissions: z.string().optional().or(z.literal('')).refine(
    (val) => {
      if (!val || val === '') return true;
      try { JSON.parse(val); return true; } catch { return false; }
    },
    { message: 'JSON inválido' }
  ),
});

export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
