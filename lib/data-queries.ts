/**
 * @fileoverview Centralized data-fetching functions.
 * These functions are server-safe and can be called from Server Components, API Routes,
 * and other Server Actions. They encapsulate the logic for retrieving data
 * via the configured database adapter.
 */
'use server';

// The project has migrated to using Prisma ORM directly.
// The functions in this file now import the Prisma client and execute queries.
// This maintains a consistent data access layer for the rest of the application.

import { prisma } from '@/lib/prisma';
import type { 
    Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@/types';
import { slugify } from './sample-data-helpers';

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
      include: {
        themes: true,
        platformPublicIdMasks: true,
        mapSettings: true,
        biddingSettings: true,
        mentalTriggerSettings: true,
        sectionBadgeVisibility: true,
        variableIncrementTable: {
            orderBy: { from: 'asc' }
        },
      }
    });
    if (!settings) {
      throw new Error("Platform settings not found in the database.");
    }
    return settings as unknown as PlatformSettings;
  } catch (error) {
    console.error("Failed to fetch platform settings:", error);
    // In a real production app, you might have a more robust fallback or error handling
    throw new Error("Could not load platform settings. The application cannot start.");
  }
}

export async function fetchAuctions(): Promise<Auction[]> {
    const auctions = await prisma.auction.findMany({
        orderBy: { auctionDate: 'desc' },
        include: {
            lots: {
                orderBy: { number: 'asc' }
            }
        }
    });
    return auctions.map(a => ({ ...a, totalLots: a.lots.length })) as unknown as Auction[];
}

export async function fetchAuction(id: string): Promise<Auction | null> {
    const auction = await prisma.auction.findFirst({
        where: { OR: [{ id }, { publicId: id }] },
        include: {
            lots: { include: { bens: true }, orderBy: { number: 'asc' } },
        },
    });
    if (!auction) return null;
    return { ...auction, totalLots: auction.lots.length } as unknown as Auction;
}

export async function fetchLots(auctionId?: string): Promise<Lot[]> {
  const lots = await prisma.lot.findMany({
    where: auctionId ? { auctionId } : {},
    include: { auction: true, category: true, subcategory: true, bens: true },
    orderBy: { number: 'asc' },
  });
  
  return lots.map(lot => ({
      ...lot,
      auctionName: lot.auction?.title,
      type: lot.category?.name, // From relation
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
  })) as unknown as Lot[];
}

export async function fetchLot(id: string): Promise<Lot | null> {
  const lot = await prisma.lot.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    include: { auction: true, category: true, subcategory: true, bens: true },
  });
  if (!lot) return null;
  return {
      ...lot,
      auctionName: lot.auction?.title,
      type: lot.category?.name,
      categoryName: lot.category?.name,
      subcategoryName: lot.subcategory?.name,
  } as unknown as Lot;
}

export async function fetchLotsByIds(ids: string[]): Promise<Lot[]> {
    if (!ids || ids.length === 0) return [];
    const lots = await prisma.lot.findMany({
        where: { OR: [{ id: { in: ids } }, { publicId: { in: ids } }] },
        include: { auction: true, category: true, subcategory: true, bens: true },
    });
    return lots.map(lot => ({
        ...lot,
        auctionName: lot.auction?.title,
        type: lot.category?.name,
        categoryName: lot.category?.name,
        subcategoryName: lot.subcategory?.name,
    })) as unknown as Lot[];
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  const bens = await prisma.bem.findMany({ where: { id: { in: ids } } });
  return bens as unknown as Bem[];
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (!ids || ids.length === 0) return [];
  const auctions = await prisma.auction.findMany({
    where: { OR: [{ id: { in: ids } }, { publicId: { in: ids } }] },
    include: { lots: true }
  });
  return auctions.map(a => ({ ...a, totalLots: a.lots.length })) as unknown as Auction[];
}

export async function fetchSellers(): Promise<SellerProfileInfo[]> {
  const sellers = await prisma.seller.findMany({ orderBy: { name: 'asc' }});
  return sellers as unknown as SellerProfileInfo[];
}

export async function fetchAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  const auctioneers = await prisma.auctioneer.findMany({ orderBy: { name: 'asc' }});
  return auctioneers as unknown as AuctioneerProfileInfo[];
}

export async function fetchCategories(): Promise<LotCategory[]> {
    const categories = await prisma.lotCategory.findMany({
        include: { subcategories: true },
        orderBy: { name: 'asc' }
    });
    return categories.map(cat => ({...cat, hasSubcategories: cat.subcategories.length > 0})) as unknown as LotCategory[];
}

export async function fetchSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    const subcategories = await prisma.subcategory.findMany({
        where: { parentCategoryId },
        orderBy: { displayOrder: 'asc' }
    });
    return subcategories as unknown as Subcategory[];
}


export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
    const seller = await prisma.seller.findFirst({
        where: { OR: [{ slug: sellerSlugOrPublicId }, { publicId: sellerSlugOrPublicId }] }
    });
    if (!seller) return [];

    const auctions = await prisma.auction.findMany({
        where: { sellerId: seller.id },
        include: { lots: true },
        orderBy: { auctionDate: 'desc' }
    });
    return auctions.map(a => ({...a, totalLots: a.lots.length})) as unknown as Auction[];
}

export async function fetchAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
     const auctioneer = await prisma.auctioneer.findFirst({
        where: { OR: [{ slug: auctioneerSlug }, { publicId: auctioneerSlug }, { id: auctioneerSlug }] }
    });
    if (!auctioneer) return [];

    const auctions = await prisma.auction.findMany({
        where: { auctioneerId: auctioneer.id },
        include: { lots: true },
        orderBy: { auctionDate: 'desc' }
    });
    return auctions.map(a => ({...a, totalLots: a.lots.length})) as unknown as Auction[];
}
