/**
 * Tipos para LotStagePrice (Preço de Lote por Praça).
 */
export interface LotStagePriceRow {
  id: string;
  lotId: string;
  lotTitle: string;
  auctionId: string;
  auctionTitle: string;
  auctionStageId: string;
  auctionStageTitle: string;
  initialBid: number | null;
  bidIncrement: number | null;
}
