
// src/app/admin/document-templates/document-template-form-schema.ts
import * as z from 'zod';
import type { DocumentTemplateType } from '@/types';

const templateTypeValues: [DocumentTemplateType, ...DocumentTemplateType[]] = [
  'WINNING_BID_TERM', 'EVALUATION_REPORT', 'AUCTION_CERTIFICATE'
];

export const documentTemplateFormSchema = z.object({
  name: z.string().min(3, {
    message: "O nome do template deve ter pelo menos 3 caracteres.",
  }).max(150),
  type: z.enum(templateTypeValues, {
    required_error: "O tipo de documento é obrigatório."
  }),
  content: z.string().min(50, {
    message: "O conteúdo do template deve ter pelo menos 50 caracteres.",
  }),
});

export type DocumentTemplateFormData = z.infer<typeof documentTemplateFormSchema>;
