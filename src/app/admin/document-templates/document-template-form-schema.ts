// src/app/admin/document-templates/document-template-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de criação e edição de Templates de Documentos. Este schema garante que
 * os campos como nome, tipo e conteúdo (HTML) sejam fornecidos e estejam
 * dentro dos limites de tamanho esperados, mantendo a integridade dos dados
 * antes de serem persistidos no banco de dados.
 */
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
