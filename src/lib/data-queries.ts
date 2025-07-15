// src/lib/data-queries.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { 
    Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory, DirectSaleOffer
} from '@/types';
import { samplePlatformSettings } from './sample-data';

console.log('[data-queries] LOG: File loaded.');

export async function getPlatformSettings(): Promise<PlatformSettings> {
  console.log('[data-queries] LOG: getPlatformSettings called.');
  const db = getDatabaseAdapter();
  const settings = await db.getPlatformSettings();
  if (!settings) {
    console.warn("[data-queries] WARN: Platform settings not found in the database. Falling back to sample data. This is expected on first init.");
    return samplePlatformSettings as PlatformSettings;
  }
  console.log('[data-queries] LOG: getPlatformSettings returned successfully.');
  return settings;
}

export async function getAuctions(): Promise<Auction[]> {
  console.log('[data-queries] LOG: getAuctions called.');
  const db = getDatabaseAdapter();
  const auctions = await db.getAuctions();
  console.log(`[data-queries] LOG: getAuctions returned ${auctions.length} items.`);
  return auctions;
}

export async function getAuction(id: string): Promise<Auction | null> {
    console.log(`[data-queries] LOG: getAuction called for id: ${id}.`);
    const db = getDatabaseAdapter();
    const auction = await db.getAuction(id);
    console.log(`[data-queries] LOG: getAuction returned ${auction ? 'one item' : 'null'}.`);
    return auction;
}


export async function getLots(auctionId?: string): Promise<Lot[]> {
  console.log(`[data-queries] LOG: getLots called for auctionId: ${auctionId || 'all'}.`);
  const db = getDatabaseAdapter();
  const lots = await db.getLots(auctionId);
  console.log(`[data-queries] LOG: getLots returned ${lots.length} items.`);
  return lots;
}

export async function getLot(id: string): Promise<Lot | null> {
  console.log(`[data-queries] LOG: getLot called for id: ${id}.`);
  const db = getDatabaseAdapter();
  const lot = await db.getLot(id);
  console.log(`[data-queries] LOG: getLot returned ${lot ? 'one item' : 'null'}.`);
  return lot;
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  console.log(`[data-queries] LOG: getLotsByIds called for ${ids.length} IDs.`);
  const db = getDatabaseAdapter();
  const lots = await db.getLotsByIds(ids);
  console.log(`[data-queries] LOG: getLotsByIds returned ${lots.length} items.`);
  return lots;
}

export async function getBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  console.log(`[data-queries] LOG: getBensByIds called for ${ids.length} IDs.`);
  const db = getDatabaseAdapter();
  const results = await db.getBensByIds(ids);
  console.log(`[data-queries] LOG: getBensByIds returned ${results.length} items.`);
  return results;
}

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  console.log(`[data-queries] LOG: getAuctionsByIds called for ${ids.length} IDs.`);
  const db = getDatabaseAdapter();
  // A simple implementation that works across adapters
  const auctions = await Promise.all(ids.map(id => db.getAuction(id)));
  const results = auctions.filter((a): a is Auction => a !== null);
  console.log(`[data-queries] LOG: getAuctionsByIds returned ${results.length} items.`);
  return results;
}

export async function getSellers(): Promise<SellerProfileInfo[]> {
  console.log('[data-queries] LOG: getSellers called.');
  const db = getDatabaseAdapter();
  const results = await db.getSellers();
  console.log(`[data-queries] LOG: getSellers returned ${results.length} items.`);
  return results;
}

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  console.log('[data-queries] LOG: getAuctioneers called.');
  const db = getDatabaseAdapter();
  const results = await db.getAuctioneers();
  console.log(`[data-queries] LOG: getAuctioneers returned ${results.length} items.`);
  return results;
}

export async function getCategories(): Promise<LotCategory[]> {
  console.log('[data-queries] LOG: getCategories called.');
  const db = getDatabaseAdapter();
  const results = await db.getLotCategories();
  console.log(`[data-queries] LOG: getCategories returned ${results.length} items.`);
  return results;
}

export async function getSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    console.log(`[data-queries] LOG: getSubcategoriesByParent called for parent: ${parentCategoryId}.`);
    const db = getDatabaseAdapter();
    // @ts-ignore
    const results = await db.getSubcategoriesByParent(parentCategoryId);
    console.log(`[data-queries] LOG: getSubcategoriesByParent returned ${results.length} items.`);
    return results;
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  console.log(`[data-queries] LOG: getAuctionsBySellerSlug called for: ${sellerSlugOrPublicId}.`);
  const db = getDatabaseAdapter();
  const allAuctions = await db.getAuctions();
  const allSellers = await db.getSellers();

  const seller = allSellers.find(s => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId || s.id === sellerSlugOrPublicId);
  
  if (seller) {
      const results = allAuctions.filter(a => a.sellerId === seller.id || a.seller === seller.name);
      console.log(`[data-queries] LOG: getAuctionsBySellerSlug found seller and returned ${results.length} auctions.`);
      return results;
  }
  console.log(`[data-queries] LOG: getAuctionsBySellerSlug did not find seller, returning 0 auctions.`);
  return [];
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
  console.log(`[data-queries] LOG: getAuctionsByAuctioneerSlug called for: ${auctioneerSlug}.`);
  const db = getDatabaseAdapter();
  const allAuctions = await db.getAuctions();
  const allAuctioneers = await db.getAuctioneers();
  
  const auctioneer = allAuctioneers.find(a => a.slug === auctioneerSlug || a.publicId === auctioneerSlug || a.id === auctioneerSlug);

   if (auctioneer) {
      const results = allAuctions.filter(a => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name);
      console.log(`[data-queries] LOG: getAuctionsByAuctioneerSlug found auctioneer and returned ${results.length} auctions.`);
      return results;
  }
  console.log(`[data-queries] LOG: getAuctionsByAuctioneerSlug did not find auctioneer, returning 0 auctions.`);
  return [];
}

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    const db = getDatabaseAdapter();
    // @ts-ignore
    return db.getDirectSaleOffers() || [];
}
