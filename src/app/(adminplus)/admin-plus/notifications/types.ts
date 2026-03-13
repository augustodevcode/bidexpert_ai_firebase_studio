/**
 * Tipos para Notification (Notificações).
 */
export interface NotificationRow {
  id: string;
  userId: string;
  userName: string;
  message: string;
  link: string | null;
  isRead: boolean;
  lotId: string | null;
  auctionId: string | null;
  createdAt: string;
}
