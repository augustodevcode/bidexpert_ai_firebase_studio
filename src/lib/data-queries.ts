// src/lib/data-queries.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { 
    Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@/types';
import { samplePlatformSettings } from './sample-data';

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const db = getDatabaseAdapter();
  const settings = await db.getPlatformSettings();
  if (!settings) {
    console.warn("Platform settings not found, returning default sample settings.");
    return samplePlatformSettings as PlatformSettings;
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
  if (ids.length === 0) return [];
  const db = getDatabaseAdapter();
  return db.getLotsByIds(ids);
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  const db = getDatabaseAdapter();
  return db.getBensByIds(ids);
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  const db = getDatabaseAdapter();
  // Firestore adapter can handle multiple gets in a single batch, but this is a safe fallback
  const auctions = await Promise.all(ids.map(id => db.getAuction(id)));
  return auctions.filter((a): a is Auction => a !== null);
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
    return db.getSubcategoriesByParent(parentCategoryId);
}

export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  const db = getDatabaseAdapter();
  const allAuctions = await db.getAuctions();
  const allSellers = await db.getSellers();

  const seller = allSellers.find(s => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId || s.id === sellerSlugOrPublicId);
  
  if (seller) {
      return allAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
  }
  return [];
}

export async function fetchAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
  const db = getDatabaseAdapter();
  const allAuctions = await db.getAuctions();
  const allAuctioneers = await db.getAuctioneers();
  
  const auctioneer = allAuctioneers.find(a => a.slug === auctioneerSlug || a.publicId === auctioneerSlug || a.id === auctioneerSlug);

   if (auctioneer) {
      return allAuctions.filter(a => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name);
  }
  return [];
}
