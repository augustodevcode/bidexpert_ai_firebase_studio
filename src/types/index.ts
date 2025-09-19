import type { Auction as PmAuction, Lot as PmLot, LotCategory as PmLotCategory, Seller as PmSeller, PlatformSettings as PmPlatformSettings } from '@prisma/client';

export type Auction = PmAuction;
export type Lot = PmLot;
export type LotCategory = PmLotCategory;
export type SellerProfileInfo = PmSeller;
export type PlatformSettings = PmPlatformSettings;