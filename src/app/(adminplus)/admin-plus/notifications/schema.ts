/**
 * Schema Zod para validação de Notification (Notificações).
 */
import { z } from 'zod';

export const notificationSchema = z.object({
  userId: z.string().min(1, 'Usuário é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  link: z.string().or(z.literal('')).optional(),
  isRead: z.boolean().optional().default(false),
  lotId: z.string().or(z.literal('')).optional(),
  auctionId: z.string().or(z.literal('')).optional(),
});

export type NotificationFormValues = z.infer<typeof notificationSchema>;
