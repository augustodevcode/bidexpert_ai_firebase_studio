// src/lib/data-queries.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { 
    Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@/types';
import { samplePlatformSettings } from './sample-data';

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  console.log('[data-queries] LOG: fetchPlatformSettings called.');
  const db = getDatabaseAdapter();
  const settings = await db.getPlatformSettings();
  if (!settings) {
    console.warn("[data-queries] WARN: Platform settings not found in the database. Falling back to sample data. This is expected on first init.");
    return samplePlatformSettings as PlatformSettings;
  }
  console.log('[data-queries] LOG: fetchPlatformSettings returned successfully.');
  return settings;
}

export async function fetchAuctions(): Promise<Auction[]> {
  console.log('[data-queries] LOG: fetchAuctions called.');
  const db = getDatabaseAdapter();
  const results = await db.getAuctions();
  console.log(`[data-queries] LOG: fetchAuctions returned ${results.length} items.`);
  return results;
}

export async function fetchAuction(id: string): Promise<Auction | null> {
    console.log(`[data-queries] LOG: fetchAuction called for id: ${id}.`);
    const db = getDatabaseAdapter();
    const result = await db.getAuction(id);
    console.log(`[data-queries] LOG: fetchAuction returned ${result ? 'one item' : 'null'}.`);
    return result;
}

export async function fetchLots(auctionId?: string): Promise<Lot[]> {
  console.log(`[data-queries] LOG: fetchLots called for auctionId: ${auctionId || 'all'}.`);
  const db = getDatabaseAdapter();
  const results = await db.getLots(auctionId);
  console.log(`[data-queries] LOG: fetchLots returned ${results.length} items.`);
  return results;
}

export async function fetchLot(id: string): Promise<Lot | null> {
  console.log(`[data-queries] LOG: fetchLot called for id: ${id}.`);
  const db = getDatabaseAdapter();
  const result = await db.getLot(id);
  console.log(`[data-queries] LOG: fetchLot returned ${result ? 'one item' : 'null'}.`);
  return result;
}

export async function fetchLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  console.log(`[data-queries] LOG: fetchLotsByIds called for ${ids.length} IDs.`);
  const db = getDatabaseAdapter();
  const results = await db.getLotsByIds(ids);
  console.log(`[data-queries] LOG: fetchLotsByIds returned ${results.length} items.`);
  return results;
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  console.log(`[data-queries] LOG: fetchBensByIds called for ${ids.length} IDs.`);
  const db = getDatabaseAdapter();
  const results = await db.getBensByIds(ids);
  console.log(`[data-queries] LOG: fetchBensByIds returned ${results.length} items.`);
  return results;
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  console.log(`[data-queries] LOG: fetchAuctionsByIds called for ${ids.length} IDs.`);
  const db = getDatabaseAdapter();
  // A simple implementation that works across adapters
  const auctions = await Promise.all(ids.map(id => db.getAuction(id)));
  const results = auctions.filter((a): a is Auction => a !== null);
  console.log(`[data-queries] LOG: fetchAuctionsByIds returned ${results.length} items.`);
  return results;
}

export async function fetchSellers(): Promise<SellerProfileInfo[]> {
  console.log('[data-queries] LOG: fetchSellers called.');
  const db = getDatabaseAdapter();
  const results = await db.getSellers();
  console.log(`[data-queries] LOG: fetchSellers returned ${results.length} items.`);
  return results;
}

export async function fetchAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  console.log('[data-queries] LOG: fetchAuctioneers called.');
  const db = getDatabaseAdapter();
  const results = await db.getAuctioneers();
  console.log(`[data-queries] LOG: fetchAuctioneers returned ${results.length} items.`);
  return results;
}

export async function fetchCategories(): Promise<LotCategory[]> {
  console.log('[data-queries] LOG: fetchCategories called.');
  const db = getDatabaseAdapter();
  const results = await db.getLotCategories();
  console.log(`[data-queries] LOG: fetchCategories returned ${results.length} items.`);
  return results;
}

export async function fetchSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    console.log(`[data-queries] LOG: fetchSubcategoriesByParent called for parent: ${parentCategoryId}.`);
    const db = getDatabaseAdapter();
    // @ts-ignore
    const results = await db.getSubcategoriesByParent(parentCategoryId);
    console.log(`[data-queries] LOG: fetchSubcategoriesByParent returned ${results.length} items.`);
    return results;
}

export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  console.log(`[data-queries] LOG: fetchAuctionsBySellerSlug called for: ${sellerSlugOrPublicId}.`);
  const db = getDatabaseAdapter();
  const allAuctions = await db.getAuctions();
  const allSellers = await db.getSellers();

  const seller = allSellers.find(s => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId || s.id === sellerSlugOrPublicId);
  
  if (seller) {
      const results = allAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
      console.log(`[data-queries] LOG: fetchAuctionsBySellerSlug found seller and returned ${results.length} auctions.`);
      return results;
  }
  console.log(`[data-queries] LOG: fetchAuctionsBySellerSlug did not find seller, returning 0 auctions.`);
  return [];
}

export async function fetchAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
  console.log(`[data-queries] LOG: fetchAuctionsByAuctioneerSlug called for: ${auctioneerSlug}.`);
  const db = getDatabaseAdapter();
  const allAuctions = await db.getAuctions();
  const allAuctioneers = await db.getAuctioneers();
  
  const auctioneer = allAuctioneers.find(a => a.slug === auctioneerSlug || a.publicId === auctioneerSlug || a.id === auctioneerSlug);

   if (auctioneer) {
      const results = allAuctions.filter(a => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name);
      console.log(`[data-queries] LOG: fetchAuctionsByAuctioneerSlug found auctioneer and returned ${results.length} auctions.`);
      return results;
  }
  console.log(`[data-queries] LOG: fetchAuctionsByAuctioneerSlug did not find auctioneer, returning 0 auctions.`);
  return [];
}
