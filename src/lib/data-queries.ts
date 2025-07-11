/**
 * @fileoverview Centralized data-fetching functions.
 * These functions are server-safe and can be called from Server Components, API Routes,
 * and other Server Actions. They encapsulate the logic for retrieving data
 * via the configured database adapter.
 */
'use server';

import { getDatabaseAdapter } from './database';
import type { 
    Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@/types';


export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const db = await getDatabaseAdapter();
  const settings = await db.getPlatformSettings();
  if (!settings) {
    throw new Error("Platform settings could not be loaded.");
  }
  return settings;
}

export async function fetchAuctions(): Promise<Auction[]> {
    const db = getDatabaseAdapter();
    return db.getAuctions();
}

export async function fetchAuction(id: string): Promise<Auction | null> {
    const db = getDatabaseAdapter();
    return db.getAuction(id);
}

export async function fetchLots(auctionId?: string): Promise<Lot[]> {
  const db = getDatabaseAdapter();
  return db.getLots(auctionId);
}

export async function fetchLot(id: string): Promise<Lot | null> {
  const db = getDatabaseAdapter();
  return db.getLot(id);
}

export async function fetchLotsByIds(ids: string[]): Promise<Lot[]> {
    const db = getDatabaseAdapter();
    return db.getLotsByIds(ids);
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  const db = getDatabaseAdapter();
  // @ts-ignore
  if (db.getBensByIds) {
      // @ts-ignore
      return db.getBensByIds(ids);
  }
  return [];
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  const db = getDatabaseAdapter();
  // This is a helper function, assuming adapter might not have it directly.
  const allAuctions = await db.getAuctions();
  return allAuctions.filter(a => ids.includes(a.id) || (a.publicId && ids.includes(a.publicId)));
}

export async function fetchSellers(): Promise<SellerProfileInfo[]> {
  const db = getDatabaseAdapter();
  return db.getSellers();
}

export async function fetchAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  const db = getDatabaseAdapter();
  return db.getAuctioneers();
}

export async function fetchCategories(): Promise<LotCategory[]> {
    const db = getDatabaseAdapter();
    return db.getLotCategories();
}

export async function fetchSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    if(db.getSubcategoriesByParentIdAction) {
        // @ts-ignore
        return db.getSubcategoriesByParentIdAction(parentCategoryId);
    }
    return [];
}

export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    if (db.getAuctionsBySellerSlug) {
      // @ts-ignore
      return db.getAuctionsBySellerSlug(sellerSlugOrPublicId);
    }
    // Fallback logic
    const allAuctions = await db.getAuctions();
    const allSellers = await db.getSellers();
    const seller = allSellers.find(s => s.slug === sellerSlugOrPublicId || s.id === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId);
    if (!seller) return [];
    return allAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
}

export async function fetchAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
     const db = getDatabaseAdapter();
    // @ts-ignore
    if (db.getAuctionsByAuctioneerSlug) {
      // @ts-ignore
      return db.getAuctionsByAuctioneerSlug(auctioneerSlug);
    }
    // Fallback logic
    const allAuctions = await db.getAuctions();
    const allAuctioneers = await db.getAuctioneers();
    const auctioneer = allAuctioneers.find(a => a.slug === auctioneerSlug || a.id === auctioneerSlug || a.publicId === auctioneerSlug);
    if (!auctioneer) return [];
    return allAuctions.filter(a => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name);
}
