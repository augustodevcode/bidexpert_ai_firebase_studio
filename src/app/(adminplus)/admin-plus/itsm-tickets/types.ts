/**
 * Tipos de dados da entidade ITSM_Ticket para listagem no Admin Plus.
 */
export interface ItsmTicketRow {
  id: string;
  publicId: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assignedToUserId: string;
  assignedToUserName: string;
  browserInfo: string;
  screenSize: string;
  pageUrl: string;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string;
  closedAt: string;
}
