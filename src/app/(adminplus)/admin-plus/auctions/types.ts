/**
 * @fileoverview Tipos de Auction para Admin Plus.
 */

export interface AuctionRow {
  id: string;
  publicId: string | null;
  slug: string | null;
  title: string;
  description: string | null;
  status: string;
  auctionType: string | null;
  auctionMethod: string | null;
  participation: string | null;
  auctionDate: string | null;
  endDate: string | null;
  totalLots: number;
  visits: number;
  initialOffer: number | null;
  isFeaturedOnMarketplace: boolean;
  onlineUrl: string | null;
  address: string | null;
  zipCode: string | null;
  supportPhone: string | null;
  supportEmail: string | null;
  supportWhatsApp: string | null;
  auctioneerId: string | null;
  auctioneerName: string | null;
  sellerId: string | null;
  sellerName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  cityId: string | null;
  cityName: string | null;
  stateId: string | null;
  stateName: string | null;
  judicialProcessId: string | null;
  judicialProcessNumber: string | null;
  createdAt: string | null;
}
