// src/lib/data-queries.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { 
    Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@/types';
import { samplePlatformSettings } from './sample-data';

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  console.log('[data-queries] LOG: Fetching platform settings...');
  const db = getDatabaseAdapter();
  const settings = await db.getPlatformSettings();
  if (!settings) {
    console.warn("[data-queries] LOG: Platform settings not found, returning default sample settings.");
    return samplePlatformSettings as PlatformSettings;
  }
  console.log(`[data-queries] LOG: Platform settings fetched successfully. Site title: ${settings.siteTitle}`);
  return settings;
}

export async function fetchAuctions(): Promise<Auction[]> {
  console.log('[data-queries] LOG: Fetching auctions...');
  const db = getDatabaseAdapter();
  const auctions = await db.getAuctions();
  console.log(`[data-queries] LOG: Found ${auctions.length} auctions.`);
  return auctions;
}

export async function fetchAuction(id: string): Promise<Auction | null> {
    console.log(`[data-queries] LOG: Fetching single auction with id: ${id}`);
    const db = getDatabaseAdapter();
    const auction = await db.getAuction(id);
    console.log(`[data-queries] LOG: Found auction? ${!!auction}`);
    return auction;
}


export async function fetchLots(auctionId?: string): Promise<Lot[]> {
  console.log(`[data-queries] LOG: Fetching lots. AuctionId: ${auctionId || 'All'}`);
  const db = getDatabaseAdapter();
  const lots = await db.getLots(auctionId);
  console.log(`[data-queries] LOG: Found ${lots.length} lots.`);
  return lots;
}

export async function fetchLot(id: string): Promise<Lot | null> {
  console.log(`[data-queries] LOG: Fetching single lot with id: ${id}`);
  const db = getDatabaseAdapter();
  const lot = await db.getLot(id);
  console.log(`[data-queries] LOG: Found lot? ${!!lot}`);
  return lot;
}

export async function fetchLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  console.log(`[data-queries] LOG: Fetching ${ids.length} lots by IDs.`);
  const db = getDatabaseAdapter();
  return db.getLotsByIds(ids);
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  console.log(`[data-queries] LOG: Fetching ${ids.length} bens by IDs.`);
  const db = getDatabaseAdapter();
  return db.getBensByIds(ids);
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  console.log(`[data-queries] LOG: Fetching ${ids.length} auctions by IDs.`);
  const db = getDatabaseAdapter();
  // Firestore adapter can handle multiple gets in a single batch, but this is a safe fallback
  const auctions = await Promise.all(ids.map(id => db.getAuction(id)));
  return auctions.filter((a): a is Auction => a !== null);
}

export async function fetchSellers(): Promise<SellerProfileInfo[]> {
  console.log('[data-queries] LOG: Fetching sellers...');
  const db = getDatabaseAdapter();
  return db.getSellers();
}

export async function fetchAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  console.log('[data-queries] LOG: Fetching auctioneers...');
  const db = getDatabaseAdapter();
  return db.getAuctioneers();
}

export async function fetchCategories(): Promise<LotCategory[]> {
  console.log('[data-queries] LOG: Fetching categories...');
  const db = getDatabaseAdapter();
  return db.getLotCategories();
}

export async function fetchSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    console.log(`[data-queries] LOG: Fetching subcategories for parent: ${parentCategoryId}`);
    const db = getDatabaseAdapter();
    // @ts-ignore
    return db.getSubcategoriesByParent(parentCategoryId);
}

export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  console.log(`[data-queries] LOG: Fetching auctions for seller slug: ${sellerSlugOrPublicId}`);
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
  console.log(`[data-queries] LOG: Fetching auctions for auctioneer slug: ${auctioneerSlug}`);
  const db = getDatabaseAdapter();
  const allAuctions = await db.getAuctions();
  const allAuctioneers = await db.getAuctioneers();
  
  const auctioneer = allAuctioneers.find(a => a.slug === auctioneerSlug || a.publicId === auctioneerSlug || a.id === auctioneerSlug);

   if (auctioneer) {
      return allAuctions.filter(a => a.auctioneerId === auctioneer.id || a.auctioneer === auctioneer.name);
  }
  return [];
}