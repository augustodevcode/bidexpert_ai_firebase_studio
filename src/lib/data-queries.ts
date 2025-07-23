// src/lib/data-queries.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { 
    Lot, Auction, UserProfileWithPermissions, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@/types';

// This file is being deprecated in favor of the Repository/Service pattern.
// New queries should not be added here. This file will be removed once all
// existing queries are migrated to their respective repositories.

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    throw new Error("Platform settings could not be loaded.");
  }
  return settings as PlatformSettings;
}

export async function fetchAuctions(): Promise<Auction[]> {
  const auctions = await prisma.auction.findMany({
    orderBy: { auctionDate: 'desc' },
    include: {
      lots: true
    }
  });
  // @ts-ignore
  return auctions.map(a => ({ ...a, totalLots: a.lots.length }));
}

export async function fetchAuction(id: string): Promise<Auction | null> {
    const auction = await prisma.auction.findFirst({
        where: { OR: [{ id }, { publicId: id }] },
        include: { 
            lots: { include: { bens: true } },
            // @ts-ignore
            auctionStages: true,
        }
    });
    if (!auction) return null;
    // @ts-ignore
    return { ...auction, totalLots: auction.lots.length };
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
   // @ts-ignore
  return lots.map(lot => ({ ...lot, auctionName: lot.auction?.title }));
}

export async function fetchLot(id: string): Promise<Lot | null> {
  // @ts-ignore
  return prisma.lot.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    include: { 
        bens: true,
        auction: true,
    }
  });
}

export async function fetchLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  // @ts-ignore
  return prisma.lot.findMany({
    where: { id: { in: ids } },
    include: { auction: true }
  });
}

export async function fetchBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  return prisma.bem.findMany({ where: { id: { in: ids } }});
}

export async function fetchAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  return prisma.auction.findMany({
    where: { OR: [{id: {in: ids}}, {publicId: {in: ids}}] },
    include: { lots: true }
  });
}

export async function fetchSellers(): Promise<SellerProfileInfo[]> {
  return prisma.seller.findMany({ orderBy: { name: 'asc' } });
}

export async function fetchAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  return prisma.auctioneer.findMany({ orderBy: { name: 'asc' } });
}

export async function fetchCategories(): Promise<LotCategory[]> {
  return prisma.lotCategory.findMany({ orderBy: { name: 'asc' } });
}

export async function fetchSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    return prisma.subcategory.findMany({
        where: { parentCategoryId },
        orderBy: { displayOrder: 'asc' }
    });
}

export async function fetchAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  return prisma.auction.findMany({
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
}

export async function fetchAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
  return prisma.auction.findMany({
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
}
