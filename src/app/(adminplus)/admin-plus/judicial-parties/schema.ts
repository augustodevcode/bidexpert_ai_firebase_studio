/**
 * Schema Zod para JudicialParty (Parte Processual).
 */
import { z } from 'zod';

export const PARTY_TYPE_OPTIONS = [
  { value: 'AUTOR', label: 'Autor' },
  { value: 'REU', label: 'Réu' },
  { value: 'ADVOGADO_AUTOR', label: 'Advogado do Autor' },
  { value: 'ADVOGADO_REU', label: 'Advogado do Réu' },
  { value: 'JUIZ', label: 'Juiz' },
  { value: 'ESCRIVAO', label: 'Escrivão' },
  { value: 'PERITO', label: 'Perito' },
  { value: 'ADMINISTRADOR_JUDICIAL', label: 'Administrador Judicial' },
  { value: 'TERCEIRO_INTERESSADO', label: 'Terceiro Interessado' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

export const judicialPartySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  documentNumber: z.string().or(z.literal('')).optional(),
  partyType: z.string().min(1, 'Tipo de parte obrigatório'),
  processId: z.string().min(1, 'Processo obrigatório'),
});
