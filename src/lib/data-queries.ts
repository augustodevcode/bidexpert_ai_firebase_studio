// src/lib/data-queries.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { 
    Lot, Auction, UserProfileWithPermissions, Role, LotCategory, AuctioneerProfileInfo, 
    SellerProfileInfo, MediaItem, PlatformSettings, Bem, Subcategory
} from '@/types';
import { samplePlatformSettings } from './sample-data'; // Importando dados de exemplo

/**
 * Fetches the platform settings from the database.
 * This is a centralized query function safe to be used by Server Components.
 * If no settings are found, it returns a default sample configuration to ensure app stability.
 * @returns {Promise<PlatformSettings>}
 */
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const settings = await prisma.platformSettings.findFirst();
  if (!settings) {
    console.warn("Platform settings not found in DB, returning default sample settings.");
    // Assegura que o objeto retornado tenha a estrutura completa de PlatformSettings
    return {
      id: 'global', // Adiciona um ID padrão
      ...samplePlatformSettings,
      themes: samplePlatformSettings.themes || [],
      platformPublicIdMasks: samplePlatformSettings.platformPublicIdMasks || {},
      homepageSections: samplePlatformSettings.homepageSections || [],
      mentalTriggerSettings: samplePlatformSettings.mentalTriggerSettings || {},
      sectionBadgeVisibility: samplePlatformSettings.sectionBadgeVisibility || {},
      mapSettings: samplePlatformSettings.mapSettings || { defaultProvider: 'openstreetmap', staticImageMapZoom: 15, staticImageMapMarkerColor: 'blue'},
      variableIncrementTable: samplePlatformSettings.variableIncrementTable || [],
      biddingSettings: samplePlatformSettings.biddingSettings || { instantBiddingEnabled: true, getBidInfoInstantly: true, biddingInfoCheckIntervalSeconds: 5},
      paymentGatewaySettings: samplePlatformSettings.paymentGatewaySettings || { defaultGateway: 'Manual', platformCommissionPercentage: 5 },
      updatedAt: new Date(), // Adiciona um timestamp válido
    } as PlatformSettings;
  }
  // Assegura que o tipo retornado corresponde à interface PlatformSettings, mesmo que o DB retorne campos opcionais
  return settings as PlatformSettings;
}

export async function fetchAuctions(): Promise<Auction[]> {
  const auctions = await prisma.auction.findMany({
    orderBy: { auctionDate: 'desc' },
    include: {
      lots: true
    }
  });
  // Prisma doesn't do virtual fields, so we map it here.
  return auctions.map(a => ({ ...a, totalLots: a.lots.length }));
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
  return lots.map(lot => ({ ...lot, auctionName: lot.auction?.title }));
}

export async function fetchLot(id: string): Promise<Lot | null> {
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
    include: { 
        lots: { select: { id: true } },
        seller: true
    }
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
    include: { lots: true, seller: true }
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
    include: { lots: true, seller: true }
  });
}