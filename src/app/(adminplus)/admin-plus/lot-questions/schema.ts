/**
 * Zod validation schema for LotQuestion entity.
 */
import { z } from 'zod';

export const lotQuestionSchema = z.object({
  lotId: z.string().min(1, 'Lote é obrigatório'),
  auctionId: z.string().min(1, 'Leilão é obrigatório'),
  userId: z.string().min(1, 'Usuário é obrigatório'),
  userDisplayName: z.string().min(1, 'Nome do usuário é obrigatório'),
  questionText: z.string().min(1, 'Pergunta é obrigatória'),
  answerText: z.string().optional().or(z.literal('')),
  isPublic: z.boolean().default(true),
  answeredByUserId: z.string().optional().or(z.literal('')),
  answeredByUserDisplayName: z.string().optional().or(z.literal('')),
});
