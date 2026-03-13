/**
 * Schema Zod para DocumentTemplate (modelo global, sem tenantId).
 * Campos: name (unique), type (enum), content (Text opcional).
 */
import { z } from 'zod';

export const DOCUMENT_TEMPLATE_TYPE_OPTIONS = [
  { value: 'WINNING_BID_TERM', label: 'Termo de Arrematação' },
  { value: 'EVALUATION_REPORT', label: 'Laudo de Avaliação' },
  { value: 'AUCTION_CERTIFICATE', label: 'Certidão de Leilão' },
] as const;

export const documentTemplateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['WINNING_BID_TERM', 'EVALUATION_REPORT', 'AUCTION_CERTIFICATE'], { required_error: 'Tipo é obrigatório' }),
  content: z.string().or(z.literal('')).optional(),
});

export type DocumentTemplateFormData = z.infer<typeof documentTemplateSchema>;
