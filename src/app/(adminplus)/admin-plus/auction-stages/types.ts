/**
 * @fileoverview Tipagem de linha da tabela AuctionStage — Admin Plus.
 */
export interface AuctionStageRow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  discountPercent: number;
  auctionId: string;
  auctionTitle: string;
  createdAt?: string;
}
