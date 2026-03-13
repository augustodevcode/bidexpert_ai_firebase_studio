/**
 * Type definitions for the Lot entity rows displayed in Admin Plus data table.
 * Includes joined FK names for display.
 */
export interface LotRow {
  id: string;
  publicId: string;
  title: string;
  number: number | null;
  slug: string | null;
  price: number;
  initialPrice: number | null;
  secondInitialPrice: number | null;
  bidIncrementStep: number | null;
  status: string;
  saleMode: string | null;
  type: string;
  condition: string | null;
  imageUrl: string | null;
  description: string | null;
  // FK joined names
  auctionId: string;
  auctionTitle: string;
  auctioneerId: string | null;
  auctioneerName: string | null;
  lotCategoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  cityId: string | null;
  cityName: string | null;
  stateId: string | null;
  stateName: string | null;
  stateUf: string | null;
  sellerId: string | null;
  sellerName: string | null;
  // Location
  mapAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  // Deposit
  requiresDepositGuarantee: boolean;
  depositGuaranteeAmount: number | null;
  depositGuaranteeInfo: string | null;
  // Flags
  isFeatured: boolean;
  isExclusive: boolean;
  discountPercentage: number | null;
  bidsCount: number;
  views: number;
  // Dates
  createdAt: string;
  updatedAt: string;
}
