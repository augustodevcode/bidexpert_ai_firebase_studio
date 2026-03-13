/**
 * Schema Zod para LotStagePrice (Preço de Lote por Praça).
 */
import { z } from 'zod';

export const lotStagePriceSchema = z.object({
  lotId: z.string().min(1, 'Lote é obrigatório'),
  auctionId: z.string().min(1, 'Leilão é obrigatório'),
  auctionStageId: z.string().min(1, 'Praça é obrigatória'),
  initialBid: z.string().or(z.literal('')).optional(),
  bidIncrement: z.string().or(z.literal('')).optional(),
});
