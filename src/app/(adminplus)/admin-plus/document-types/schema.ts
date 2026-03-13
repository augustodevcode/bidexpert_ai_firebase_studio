/**
 * @fileoverview Schemas Zod para validação de Tipos de Documento no Admin Plus.
 */
import { z } from 'zod';

export const appliesToOptions = ['PHYSICAL', 'LEGAL', 'BOTH'] as const;

export const createDocumentTypeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(150),
  description: z.string().max(500).optional().or(z.literal('')),
  isRequired: z.boolean().default(true),
  appliesTo: z.enum(appliesToOptions, { required_error: 'Selecione a aplicação' }),
});

export const updateDocumentTypeSchema = createDocumentTypeSchema.partial();

export type CreateDocumentTypeInput = z.infer<typeof createDocumentTypeSchema>;
export type UpdateDocumentTypeInput = z.infer<typeof updateDocumentTypeSchema>;
