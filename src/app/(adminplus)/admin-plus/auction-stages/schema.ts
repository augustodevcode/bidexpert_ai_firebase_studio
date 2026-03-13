/**
 * @fileoverview Schema Zod para AuctionStage — Admin Plus.
 */
import { z } from 'zod';

export const AUCTION_STAGE_STATUSES = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'SUSPENSO', label: 'Suspenso' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'AGUARDANDO_INICIO', label: 'Aguardando Início' },
  { value: 'ABERTO', label: 'Aberto' },
  { value: 'FECHADO', label: 'Fechado' },
] as const;

export const auctionStageSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  startDate: z.string().min(1, 'Data início é obrigatória'),
  endDate: z.string().min(1, 'Data fim é obrigatória'),
  status: z.string().optional().or(z.literal('')),
  discountPercent: z.string().optional().or(z.literal('')),
  auctionId: z.string().optional().or(z.literal('')),
});

export type AuctionStageSchema = z.infer<typeof auctionStageSchema>;
