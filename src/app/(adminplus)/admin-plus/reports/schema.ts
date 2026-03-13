/**
 * @fileoverview Schema Zod para formulários de Report no Admin Plus.
 */

import { z } from 'zod';

const jsonStringSchema = z.string().min(2, 'Definição é obrigatória').refine((value) => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}, 'JSON inválido na definição do relatório');

export const reportSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(120),
  description: z.string().max(300).optional().or(z.literal('')),
  definitionText: jsonStringSchema,
});

export type ReportFormData = z.infer<typeof reportSchema>;