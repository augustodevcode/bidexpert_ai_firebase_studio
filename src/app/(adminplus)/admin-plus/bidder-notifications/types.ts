/**
 * Tipos de dados da entidade BidderNotification para listagem no Admin Plus.
 */
export interface BidderNotificationRow {
  id: string;
  bidderId: string;
  bidderName: string;
  type: string;
  title: string;
  message: string;
  data: string;
  isRead: boolean;
  readAt: string;
  createdAt: string;
}
