/**
 * Tipo de linha para AuctionHabilitation na DataTable.
 * Composite PK: userId + auctionId.
 */
export interface AuctionHabilitationRow {
  userId: string;
  userName: string;
  auctionId: string;
  auctionTitle: string;
  habilitatedAt: string;
}
