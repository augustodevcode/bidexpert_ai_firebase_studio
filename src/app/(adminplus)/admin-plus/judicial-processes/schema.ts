/**
 * @fileoverview Schema Zod para JudicialProcess — Admin Plus.
 */
import { z } from 'zod';

export const ACTION_TYPES = [
  { value: 'USUCAPIAO', label: 'Usucapião' },
  { value: 'REMOCAO', label: 'Remoção' },
  { value: 'HIPOTECA', label: 'Hipoteca' },
  { value: 'DESPEJO', label: 'Despejo' },
  { value: 'PENHORA', label: 'Penhora' },
  { value: 'COBRANCA', label: 'Cobrança' },
  { value: 'INVENTARIO', label: 'Inventário' },
  { value: 'DIVORCIO', label: 'Divórcio' },
  { value: 'OUTROS', label: 'Outros' },
] as const;

export const judicialProcessSchema = z.object({
  processNumber: z.string().min(1, 'Número do processo é obrigatório'),
  isElectronic: z.boolean().optional().default(true),
  courtId: z.string().optional().or(z.literal('')),
  districtId: z.string().optional().or(z.literal('')),
  branchId: z.string().optional().or(z.literal('')),
  sellerId: z.string().optional().or(z.literal('')),
  propertyMatricula: z.string().optional().or(z.literal('')),
  propertyRegistrationNumber: z.string().optional().or(z.literal('')),
  actionType: z.string().optional().or(z.literal('')),
  actionDescription: z.string().optional().or(z.literal('')),
  actionCnjCode: z.string().optional().or(z.literal('')),
});

export type JudicialProcessSchema = z.infer<typeof judicialProcessSchema>;
