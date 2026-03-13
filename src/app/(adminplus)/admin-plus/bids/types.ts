/**
 * Row type for the Bid entity (Admin Plus CRUD).
 */
export interface BidRow {
  id: string;
  lotId: string;
  lotTitle: string;
  auctionId: string;
  auctionTitle: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  status: string;
  bidOrigin: string;
  isAutoBid: boolean;
  bidderDisplay: string | null;
  bidderAlias: string | null;
  timestamp: string;
  cancelledAt: string | null;
  createdAt: string;
}
