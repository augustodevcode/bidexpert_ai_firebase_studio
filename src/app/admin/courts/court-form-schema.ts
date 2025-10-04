// src/app/admin/courts/court-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de criação e edição de Tribunais. Garante que os dados como nome, UF e website
 * sejam consistentes antes do envio para o servidor.
 */
import * as z from 'zod';

const optionalUrlSchema = z.string().url({ message: "URL inválida." }).or(z.literal('')).optional().nullable();

export const courtFormSchema = z.object({
  name: z.string().min(5, {
    message: "O nome do tribunal deve ter pelo menos 5 caracteres.",
  }).max(150, {
    message: "O nome do tribunal não pode exceder 150 caracteres.",
  }),
  stateUf: z.string().length(2, {
    message: "O estado (UF) é obrigatório e deve ter 2 caracteres.",
  }),
  website: optionalUrlSchema,
});

export type CourtFormValues = z.infer<typeof courtFormSchema>;
