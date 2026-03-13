/**
 * Schema Zod para UserLotMaxBid (Lance Máximo Automático).
 * FKs: userId, lotId. Campos: maxAmount, isActive.
 */
import { z } from 'zod';

export const userLotMaxBidSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
  lotId: z.string().min(1, 'Lote é obrigatório'),
  maxAmount: z.coerce.number().positive('Valor deve ser positivo'),
  isActive: z.boolean().default(true),
});

export type UserLotMaxBidFormData = z.infer<typeof userLotMaxBidSchema>;
