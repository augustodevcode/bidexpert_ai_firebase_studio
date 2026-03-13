/**
 * Schema Zod para Review (Avaliação de Lote/Leilão).
 * FKs: lotId, auctionId, userId. Campos: rating, comment, userDisplayName.
 */
import { z } from 'zod';

export const reviewSchema = z.object({
  lotId: z.string().min(1, 'Lote é obrigatório'),
  auctionId: z.string().min(1, 'Leilão é obrigatório'),
  userId: z.string().min(1, 'Usuário é obrigatório'),
  rating: z.coerce.number().int().min(1, 'Mínimo 1').max(5, 'Máximo 5'),
  comment: z.string().or(z.literal('')).optional(),
  userDisplayName: z.string().min(1, 'Nome do avaliador é obrigatório'),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
