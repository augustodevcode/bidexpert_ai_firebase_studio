/**
 * Tipos para listagem de UserLotMaxBid.
 */
export interface UserLotMaxBidRow {
  id: string;
  userId: string;
  userName: string;
  lotId: string;
  lotTitle: string;
  maxAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
