/**
 * Schema de validação Zod para ParticipationHistory no Admin Plus.
 */
import { z } from 'zod';

export const PARTICIPATION_RESULT_OPTIONS = [
  { value: 'WON', label: 'Venceu' },
  { value: 'LOST', label: 'Perdeu' },
  { value: 'WITHDRAWN', label: 'Desistiu' },
] as const;

export const participationHistorySchema = z.object({
  bidderId: z.string().min(1, 'Arrematante obrigatório'),
  lotId: z.string().min(1, 'Lote obrigatório'),
  auctionId: z.string().min(1, 'Leilão obrigatório'),
  title: z.string().min(1, 'Título obrigatório'),
  auctionName: z.string().min(1, 'Nome do leilão obrigatório'),
  maxBid: z.string().optional().or(z.literal('')),
  finalBid: z.string().optional().or(z.literal('')),
  result: z.string().min(1, 'Resultado obrigatório'),
  bidCount: z.coerce.number().int().min(0).default(0),
});

export type ParticipationHistoryFormData = z.infer<typeof participationHistorySchema>;
