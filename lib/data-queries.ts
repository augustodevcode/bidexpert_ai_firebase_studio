// src/lib/data-queries.ts
'use server';

import { prisma } from '@/lib/database';
import type { 
    Lot, Auction, UserProfileWithPermissions, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@/types';
import { sanitizeArray, sanitizeObject } from './query-helpers';

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'global' },
    include: {
        themes: true,
        platformPublicIdMasks: true,
        mapSettings: true,
        biddingSettings: true,
        mentalTriggerSettings: true,
        sectionBadgeVisibility: true,
        variableIncrementTable: true,
    }
  });
  if (!settings) {
    throw new Error("Platform settings could not be loaded.");
  }
  return sanitizeObject(settings) as PlatformSettings;
}

export async function fetchAuctions(): Promise<Auction[]> {
  const auctions = await prisma.auction.findMany({
    orderBy: { auctionDate: 'desc' },
    include: {
      lots: true
    }
  });
  // Prisma doesn't do virtual fields, so we map it here.
  const processedAuctions = auctions.map(a => ({ ...a, totalLots: a.lots.length }));
  return sanitizeArray(processedAuctions);
}

export async function fetchAuction(id: string): Promise<Auction | null> {
    const auction = await prisma.auction.findFirst({
        where: { OR: [{ id }, { publicId: id }] },
        include: { 
            lots: { include: { bens: true } },
            auctionStages: true,
        }
    });
    if (!auction) return null;
    const processedAuction = { ...auction, totalLots: auction.lots.length };
    return sanitizeObject(processedAuction);
}


export async function fetchLots(auctionId?: string): Promise<Lot[]> {
  const lots = await prisma.lot.findMany({
    where: auctionId ? { auctionId } : {},
    include: {
        bens: true,
        auction: { select: { title: true } }
    },
    orderBy: { number: 'asc' }
  });
  const processedLots = lots.map(lot => ({ ...lot, auctionName: lot.auction?.title }));
  return sanitizeArray(processedLots);
}

export async function fetchLot(id: string): Promise<Lot | null> {
  const lot = await prisma.lot.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    include: { 
        bens: true,
        auction: true,
    }
  });
  return sanitizeObject(lot);
}

export async function fetchLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  const lots = await prisma.lot.findMany({
    where: { id: { in: ids } },
    include: { auction: true }
  });
  return sanitizeArray(lots);
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  const bens = await prisma.bem.findMany({ where: { id: { in: ids } }});
  return sanitizeArray(bens);
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  const auctions = await prisma.auction.findMany({
    where: { OR: [{id: {in: ids}}, {publicId: {in: ids}}] },
    include: { lots: true }
  });
  return sanitizeArray(auctions);
}

export async function fetchSellers(): Promise<SellerProfileInfo[]> {
  const sellers = await prisma.seller.findMany({ orderBy: { name: 'asc' } });
  return sanitizeArray(sellers);
}

export async function fetchAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  const auctioneers = await prisma.auctioneer.findMany({ orderBy: { name: 'asc' } });
  return sanitizeArray(auctioneers);
}

export async function fetchCategories(): Promise<LotCategory[]> {
  const categories = await prisma.lotCategory.findMany({ orderBy: { name: 'asc' } });
  return sanitizeArray(categories);
}

export async function fetchSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    const subcategories = await prisma.subcategory.findMany({
        where: { parentCategoryId },
        orderBy: { displayOrder: 'asc' }
    });
    return sanitizeArray(subcategories);
}

export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  const auctions = await prisma.auction.findMany({
    where: {
      seller: {
        OR: [
          { slug: sellerSlugOrPublicId },
          { id: sellerSlugOrPublicId },
          { publicId: sellerSlugOrPublicId }
        ]
      }
    },
    include: { lots: true }
  });
  return sanitizeArray(auctions);
}

export async function fetchAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
  const auctions = await prisma.auction.findMany({
    where: {
      auctioneer: {
        OR: [
          { slug: auctioneerSlug },
          { id: auctioneerSlug },
          { publicId: auctioneerSlug }
        ]
      }
    },
    include: { lots: true }
  });
  return sanitizeArray(auctions);
}
