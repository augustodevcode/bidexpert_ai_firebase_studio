/**
 * Tipos para listagem de Review.
 */
export interface ReviewRow {
  id: string;
  lotId: string;
  lotTitle: string;
  auctionId: string;
  auctionTitle: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string | null;
  userDisplayName: string;
  createdAt: string;
  updatedAt: string;
}
