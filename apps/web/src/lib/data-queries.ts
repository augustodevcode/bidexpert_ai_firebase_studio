// src/lib/data-queries.ts
'use server';

import { 
    AuctionService,
    LotService,
    PlatformSettingsService,
    SellerService,
    AuctioneerService,
    CategoryService,
    SubcategoryService,
    BemService
} from '@bidexpert/core/services';

import type { 
    Lot, Auction, UserProfileWithPermissions, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@bidexpert/core';


const platformSettingsService = new PlatformSettingsService();
const auctionService = new AuctionService();
const lotService = new LotService();
const sellerService = new SellerService();
const auctioneerService = new AuctioneerService();
const categoryService = new CategoryService();
const subcategoryService = new SubcategoryService();
const bemService = new BemService();

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  return platformSettingsService.getSettings();
}

export async function fetchAuctions(): Promise<Auction[]> {
  return auctionService.getAuctions();
}

export async function fetchAuction(id: string): Promise<Auction | null> {
    return auctionService.getAuctionById(id);
}


export async function fetchLots(auctionId?: string): Promise<Lot[]> {
  return lotService.getLots(auctionId);
}

export async function fetchLot(id: string): Promise<Lot | null> {
  return lotService.getLotById(id);
}

export async function fetchLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  return lotService.getLotsByIds(ids);
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  return bemService.getBensByIds(ids);
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  return auctionService.getAuctionsByIds(ids);
}

export async function fetchSellers(): Promise<SellerProfileInfo[]> {
  return sellerService.getSellers();
}

export async function fetchAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  return auctioneerService.getAuctioneers();
}

export async function fetchCategories(): Promise<LotCategory[]> {
  return categoryService.getCategories();
}

export async function fetchSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    return subcategoryService.getSubcategoriesByParentId(parentCategoryId);
}

export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  return sellerService.getAuctionsBySellerSlug(sellerSlugOrPublicId);
}

export async function fetchAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
  return auctioneerService.getAuctionsByAuctioneerSlug(auctioneerSlug);
}
