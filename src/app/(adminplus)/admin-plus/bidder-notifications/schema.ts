/**
 * Schema Zod de validação de BidderNotification (notificações para arrematantes).
 */
import { z } from 'zod';

export const BIDDER_NOTIFICATION_TYPE_OPTIONS = [
  { value: 'AUCTION_WON', label: 'Leilão Vencido' },
  { value: 'PAYMENT_DUE', label: 'Pagamento Pendente' },
  { value: 'PAYMENT_OVERDUE', label: 'Pagamento Vencido' },
  { value: 'DOCUMENT_APPROVED', label: 'Documento Aprovado' },
  { value: 'DOCUMENT_REJECTED', label: 'Documento Rejeitado' },
  { value: 'DELIVERY_UPDATE', label: 'Atualização de Entrega' },
  { value: 'AUCTION_ENDING', label: 'Leilão Encerrando' },
  { value: 'SYSTEM_UPDATE', label: 'Atualização do Sistema' },
] as const;

export const bidderNotificationSchema = z.object({
  bidderId: z.string().min(1, 'Arrematante obrigatório'),
  type: z.string().min(1, 'Tipo obrigatório'),
  title: z.string().min(1, 'Título obrigatório'),
  message: z.string().min(1, 'Mensagem obrigatória'),
  data: z.string().optional().or(z.literal('')),
  isRead: z.boolean().optional(),
});

export type BidderNotificationFormData = z.infer<typeof bidderNotificationSchema>;
