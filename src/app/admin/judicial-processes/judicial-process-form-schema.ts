// src/app/admin/judicial-processes/judicial-process-form-schema.ts
/**
 * @fileoverview Define o schema de validação (usando Zod) para o formulário
 * de Processos Judiciais. Garante a integridade dos dados, incluindo o número
 * do processo, a vinculação com as entidades judiciárias (tribunal, comarca, vara)
 * e a validação de um array de partes envolvidas.
 */
import * as z from 'zod';
import type { ProcessPartyType } from '@/types';

const partyTypes: [ProcessPartyType, ...ProcessPartyType[]] = [
  'AUTOR', 'REU', 'ADVOGADO_AUTOR', 'ADVOGADO_REU', 'JUIZ', 'ESCRIVAO', 'PERITO', 'ADMINISTRADOR_JUDICIAL', 'TERCEIRO_INTERESSADO', 'OUTRO'
];

export const partySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "O nome da parte deve ter pelo menos 3 caracteres."),
  documentNumber: z.string().optional(),
  partyType: z.enum(partyTypes, { required_error: "Selecione o tipo da parte." }),
});

export const judicialProcessFormSchema = z.object({
  processNumber: z.string().min(10, {
    message: "O número do processo é obrigatório e parece curto demais.",
  }).max(100, {
    message: "O número do processo não pode exceder 100 caracteres.",
  }),
  isElectronic: z.boolean().default(true),
  courtId: z.string().min(1, { message: "O tribunal é obrigatório."}),
  districtId: z.string().min(1, { message: "A comarca é obrigatória."}),
  branchId: z.string().min(1, { message: "A vara é obrigatória."}),
  sellerId: z.string().optional().nullable(),
  parties: z.array(partySchema).min(1, "O processo deve ter pelo menos uma parte envolvida."),
});

export type JudicialProcessFormValues = z.infer<typeof judicialProcessFormSchema>;
