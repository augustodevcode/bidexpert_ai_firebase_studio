// src/lib/data-queries.ts
import { prisma } from '@/lib/prisma';
import type { 
    Lot, Auction, UserProfileData, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory, DirectSaleOffer
} from '@/types';
import { samplePlatformSettings } from './sample-data';

console.log('[data-queries] LOG: File loaded.');

export async function getPlatformSettings(): Promise<PlatformSettings> {
  console.log('[data-queries] LOG: getPlatformSettings called.');
  const settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    console.warn("[data-queries] WARN: Platform settings not found in the database. Falling back to sample data. This is expected on first init.");
    // @ts-ignore
    return samplePlatformSettings;
  }
  console.log('[data-queries] LOG: getPlatformSettings returned successfully.');
  // @ts-ignore
  return settings;
}

export async function getAuctions(): Promise<Auction[]> {
  console.log('[data-queries] LOG: getAuctions called.');
  const auctions = await prisma.auction.findMany({
    orderBy: { auctionDate: 'desc' },
    include: { lots: true }
  });
  // @ts-ignore
  return auctions.map(a => ({...a, totalLots: a.lots.length}));
}

export async function getAuction(id: string): Promise<Auction | null> {
    console.log(`[data-queries] LOG: getAuction called for id: ${id}.`);
    const auction = await prisma.auction.findFirst({
        where: { OR: [{ id }, { publicId: id }] },
        include: { 
            lots: { include: { bens: true } },
            auctionStages: true,
        }
    });
    if (!auction) return null;
    // @ts-ignore
    return { ...auction, totalLots: auction.lots.length };
}


export async function getLots(auctionId?: string): Promise<Lot[]> {
  console.log(`[data-queries] LOG: getLots called for auctionId: ${auctionId || 'all'}.`);
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

export async function getLot(id: string): Promise<Lot | null> {
  console.log(`[data-queries] LOG: getLot called for id: ${id}.`);
  const lot = await prisma.lot.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    include: { 
        bens: true,
        auction: true,
    }
  });
  console.log(`[data-queries] LOG: getLot returned ${lot ? 'one item' : 'null'}.`);
  return lot;
}

export async function getLotsByIds(ids: string[]): Promise<Lot[]> {
  if (ids.length === 0) return [];
  console.log(`[data-queries] LOG: getLotsByIds called for ${ids.length} IDs.`);
  const lots = await prisma.lot.findMany({
    where: { id: { in: ids } },
    include: { auction: true }
  });
  console.log(`[data-queries] LOG: getLotsByIds returned ${lots.length} items.`);
  return lots;
}

export async function getBensByIds(ids: string[]): Promise<Bem[]> {
  if (!ids || ids.length === 0) return [];
  console.log(`[data-queries] LOG: getBensByIds called for ${ids.length} IDs.`);
  const results = await prisma.bem.findMany({ where: { id: { in: ids } }});
  console.log(`[data-queries] LOG: getBensByIds returned ${results.length} items.`);
  return results;
}

export async function getAuctionsByIds(ids: string[]): Promise<Auction[]> {
  if (ids.length === 0) return [];
  console.log(`[data-queries] LOG: getAuctionsByIds called for ${ids.length} IDs.`);
  const results = await prisma.auction.findMany({
    where: { OR: [{id: {in: ids}}, {publicId: {in: ids}}] },
    include: { lots: true }
  });
  console.log(`[data-queries] LOG: getAuctionsByIds returned ${results.length} items.`);
  return results;
}

export async function getSellers(): Promise<SellerProfileInfo[]> {
  console.log('[data-queries] LOG: getSellers called.');
  const results = await prisma.seller.findMany({ orderBy: { name: 'asc' } });
  console.log(`[data-queries] LOG: getSellers returned ${results.length} items.`);
  return results;
}

export async function getAuctioneers(): Promise<AuctioneerProfileInfo[]> {
  console.log('[data-queries] LOG: getAuctioneers called.');
  const results = await prisma.auctioneer.findMany({ orderBy: { name: 'asc' } });
  console.log(`[data-queries] LOG: getAuctioneers returned ${results.length} items.`);
  return results;
}

export async function getCategories(): Promise<LotCategory[]> {
  console.log('[data-queries] LOG: getCategories called.');
  const results = await prisma.lotCategory.findMany({ orderBy: { name: 'asc' } });
  console.log(`[data-queries] LOG: getCategories returned ${results.length} items.`);
  return results;
}

export async function getSubcategoriesByParent(parentCategoryId: string): Promise<Subcategory[]> {
    console.log(`[data-queries] LOG: getSubcategoriesByParent called for parent: ${parentCategoryId}.`);
    const results = await prisma.subcategory.findMany({
        where: { parentCategoryId },
        orderBy: { displayOrder: 'asc' }
    });
    console.log(`[data-queries] LOG: getSubcategoriesByParent returned ${results.length} items.`);
    return results;
}

export async function getAuctionsBySellerSlug(sellerSlugOrPublicId: string): Promise<Auction[]> {
  console.log(`[data-queries] LOG: getAuctionsBySellerSlug called for: ${sellerSlugOrPublicId}.`);
  const results = await prisma.auction.findMany({
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
  console.log(`[data-queries] LOG: getAuctionsBySellerSlug found seller and returned ${results.length} auctions.`);
  return results;
}

export async function getAuctionsByAuctioneerSlug(auctioneerSlug: string): Promise<Auction[]> {
  console.log(`[data-queries] LOG: getAuctionsByAuctioneerSlug called for: ${auctioneerSlug}.`);
  const results = await prisma.auction.findMany({
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
  console.log(`[data-queries] LOG: getAuctionsByAuctioneerSlug found auctioneer and returned ${results.length} auctions.`);
  return results;
}

export async function getDirectSaleOffers(): Promise<DirectSaleOffer[]> {
    return prisma.directSaleOffer.findMany();
}
