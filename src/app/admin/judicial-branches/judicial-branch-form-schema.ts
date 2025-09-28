// src/app/admin/judicial-branches/judicial-branch-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de criação e edição de Varas Judiciais. Garante a integridade dos dados, como
 * a obrigatoriedade do nome e da associação com uma Comarca.
 */
import * as z from 'zod';

export const judicialBranchFormSchema = z.object({
  name: z.string().min(5, {
    message: "O nome da vara deve ter pelo menos 5 caracteres.",
  }).max(150, {
    message: "O nome da vara não pode exceder 150 caracteres.",
  }),
  districtId: z.string().min(1, { message: "Selecione a comarca à qual a vara pertence."}),
  contactName: z.string().max(150, "Nome do contato muito longo.").optional().nullable(),
  phone: z.string().max(20, "Número de telefone muito longo.").optional().nullable(),
  email: z.string().email({ message: "Formato de e-mail inválido." }).optional().nullable().or(z.literal('')),
});

export type JudicialBranchFormValues = z.infer<typeof judicialBranchFormSchema>;
