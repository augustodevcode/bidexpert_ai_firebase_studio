/**
 * Tipos da entidade ParticipationHistory no Admin Plus.
 */
export interface ParticipationHistoryRow {
  id: string;
  bidderId: string;
  bidderName: string;
  lotId: string;
  auctionId: string;
  title: string;
  auctionName: string;
  maxBid: string;
  finalBid: string;
  result: string;
  bidCount: number;
  participatedAt: string;
  createdAt: string;
}
