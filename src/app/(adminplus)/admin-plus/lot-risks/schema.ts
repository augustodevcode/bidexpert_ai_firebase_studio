/**
 * Zod validation schema for LotRisk entity.
 */
import { z } from 'zod';

export const LOT_RISK_TYPES = [
  { value: 'OCUPACAO_IRREGULAR', label: 'Ocupação Irregular' },
  { value: 'PENHORA', label: 'Penhora' },
  { value: 'INSCRICAO_DIVIDA', label: 'Inscrição em Dívida' },
  { value: 'RESTRICAO_AMBIENTAL', label: 'Restrição Ambiental' },
  { value: 'DOENCA_ACARAJADO', label: 'Doença Acarajado' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

export const LOT_RISK_LEVELS = [
  { value: 'BAIXO', label: 'Baixo' },
  { value: 'MEDIO', label: 'Médio' },
  { value: 'ALTO', label: 'Alto' },
  { value: 'CRITICO', label: 'Crítico' },
] as const;

export const lotRiskSchema = z.object({
  lotId: z.string().min(1, 'Lote é obrigatório'),
  riskType: z.string().min(1, 'Tipo de risco é obrigatório'),
  riskLevel: z.string().min(1, 'Nível de risco é obrigatório'),
  riskDescription: z.string().min(1, 'Descrição é obrigatória'),
  mitigationStrategy: z.string().optional().or(z.literal('')),
  verified: z.boolean().default(false),
  verifiedBy: z.string().optional().or(z.literal('')),
});
