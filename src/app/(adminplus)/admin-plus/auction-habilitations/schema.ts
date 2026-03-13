/**
 * Schema de validação Zod para AuctionHabilitation.
 * Composite PK: userId + auctionId (sem id auto-incremental).
 */
import { z } from 'zod';

export const auctionHabilitationSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
  auctionId: z.string().min(1, 'Leilão é obrigatório'),
});

export type AuctionHabilitationFormData = z.infer<typeof auctionHabilitationSchema>;
