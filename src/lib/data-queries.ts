/**
 * @fileoverview Centralized data-fetching functions.
 * These functions are server-safe and can be called from Server Components, API Routes,
 * and other Server Actions. They encapsulate the logic for retrieving data
 * via the configured database adapter.
 */
import 'server-only';
import { getDatabaseAdapter } from '@/lib/database/index';
import type { 
    Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem
} from '@/types';

// Each function follows a pattern:
// 1. Get the current database adapter.
// 2. Call the corresponding method on the adapter.
// 3. Return the data.
// This keeps the data-access logic clean and consistent.

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const db = await getDatabaseAdapter();
  const settings = await db.getPlatformSettings();
  if (!settings) {
    throw new Error("Platform settings could not be loaded.");
  }
  return settings;
}

export async function fetchAuctions(): Promise<Auction[]> {
    const db = await getDatabaseAdapter();
    return db.getAuctions();
}

export async function fetchAuction(id: string): Promise<Auction | null> {
    const db = await getDatabaseAdapter();
    return db.getAuction(id);
}

export async function fetchLots(auctionId?: string): Promise<Lot[]> {
  const db = await getDatabaseAdapter();
  return db.getLots(auctionId);
}

export async function fetchLot(id: string): Promise<Lot | null> {
  const db = await getDatabaseAdapter();
  return db.getLot(id);
}

export async function fetchLotsByIds(ids: string[]): Promise<Lot[]> {
    const db = await getDatabaseAdapter();
    return db.getLotsByIds(ids);
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
    if (!ids || ids.length === 0) return [];
    const db = await getDatabaseAdapter();
    // @ts-ignore Assuming adapter has this method
    return db.getBensByIds ? db.getBensByIds(ids) : [];
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (!ids || ids.length === 0) return [];
  const db = await getDatabaseAdapter();
  const allAuctions = await db.getAuctions();
  return allAuctions.filter(a => ids.includes(a.id) || (a.publicId && ids.includes(a.publicId)));
}

export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    const db = await getDatabaseAdapter();
    const allAuctions = await db.getAuctions();
    const allSellers = await db.getSellers();
    const seller = allSellers.find(s => s.slug === sellerSlugOrPublicId || s.publicId === sellerSlugOrPublicId);
    if (!seller) return [];
    return allAuctions.filter(a => a.seller === seller.name);
}

export async function fetchAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
    const db = await getDatabaseAdapter();
    const allAuctions = await db.getAuctions();
    const auctioneers = await db.getAuctioneers();
    const auctioneer = auctioneers.find(a => a.slug === auctioneerSlug || a.publicId === auctioneerSlug || a.id === auctioneerSlug);
    if (!auctioneer) return [];
    return allAuctions.filter(a => a.auctioneer === auctioneer.name);
}
