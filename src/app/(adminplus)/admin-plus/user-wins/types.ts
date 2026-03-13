/**
 * Tipos para UserWin (Arrematações).
 */
export interface UserWinRow {
  id: string;
  lotId: string;
  lotTitle: string;
  userId: string;
  userName: string;
  winningBidAmount: number;
  winDate: string;
  paymentStatus: string;
  retrievalStatus: string;
  invoiceUrl: string | null;
  createdAt: string;
}
