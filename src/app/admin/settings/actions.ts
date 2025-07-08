
// src/app/admin/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';

// Default settings object moved here to avoid invalid import paths.
const samplePlatformSettings: PlatformSettings = {
  id: 'global',
  siteTitle: "BidExpert Leilões",
  siteTagline: "Sua plataforma definitiva para leilões online.",
  galleryImageBasePath: "/uploads/media/",
  storageProvider: "local",
  firebaseStorageBucket: "bidexpert-630df.appspot.com",
  activeThemeName: "Padrão BidExpert",
  themes: [
    {
      name: "Padrão BidExpert",
      colors: {
        "--background": "hsl(0 0% 100%)",
        "--foreground": "hsl(0 0% 3.9%)",
        "--primary": "hsl(25 95% 53%)",
        "--primary-foreground": "hsl(0 0% 100%)",
        "--secondary": "hsl(0 0% 96.1%)",
        "--accent": "hsl(25 95% 95%)"
      }
    }
  ],
  platformPublicIdMasks: {
    auctions: "LEIL-",
    lots: "LOTE-",
    auctioneers: "LEILOE-",
    sellers: "COMIT-"
  },
  homepageSections: [
    { id: "hero", type: "hero_carousel", title: "Destaques Principais", visible: true, order: 1 },
    { id: "filter_links", type: "filter_links", title: "Explorar por Tipo", visible: true, order: 2 },
    { id: "featured_lots", type: "featured_lots", title: "Lotes em Destaque", visible: true, order: 3, itemCount: 10 },
    { id: "active_auctions", type: "active_auctions", title: "Leilões Ativos", visible: true, order: 4, itemCount: 10 }
  ],
  mentalTriggerSettings: {
    showDiscountBadge: true,
    showUrgencyTimer: true,
    urgencyTimerThresholdDays: 1,
    urgencyTimerThresholdHours: 12,
    showPopularityBadge: true,
    popularityViewThreshold: 500,
    showHotBidBadge: true,
    hotBidThreshold: 10,
    showExclusiveBadge: true
  },
  sectionBadgeVisibility: {
    featuredLots: { showStatusBadge: false, showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true },
    searchGrid: { showStatusBadge: true, showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true },
    searchList: { showStatusBadge: true, showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true },
    lotDetail: { showStatusBadge: true, showDiscountBadge: true, showUrgencyTimer: true, showPopularityBadge: true, showHotBidBadge: true, showExclusiveBadge: true }
  },
  mapSettings: {
    defaultProvider: "openstreetmap",
    googleMapsApiKey: "",
    staticImageMapZoom: 15,
    staticImageMapMarkerColor: "blue"
  },
  biddingSettings: {
    instantBiddingEnabled: true,
    getBidInfoInstantly: true,
    biddingInfoCheckIntervalSeconds: 1,
  },
  searchPaginationType: "loadMore",
  searchItemsPerPage: 12,
  searchLoadMoreCount: 12,
  showCountdownOnLotDetail: true,
  showCountdownOnCards: true,
  showRelatedLotsOnLotDetail: true,
  relatedLotsCount: 5,
  variableIncrementTable: [],
  defaultListItemsPerPage: 10,
  updatedAt: new Date().toISOString()
};


export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const settings = await prisma.platformSettings.findFirst({
      where: { id: 'global' },
    });
    
    if (settings) {
      // The settings from Prisma might be missing some newer optional fields.
      // We merge them with the defaults to ensure the object is complete.
      return {
        ...samplePlatformSettings,
        ...(settings as unknown as PlatformSettings),
        // Explicitly merge nested objects to avoid them being overwritten by null/undefined from DB
        platformPublicIdMasks: { ...samplePlatformSettings.platformPublicIdMasks, ...settings.platformPublicIdMasks as object },
        mapSettings: { ...samplePlatformSettings.mapSettings, ...settings.mapSettings as object },
        biddingSettings: { ...samplePlatformSettings.biddingSettings, ...settings.biddingSettings as object },
        mentalTriggerSettings: { ...samplePlatformSettings.mentalTriggerSettings, ...settings.mentalTriggerSettings as object },
        sectionBadgeVisibility: { ...samplePlatformSettings.sectionBadgeVisibility, ...settings.sectionBadgeVisibility as object },
      };
    }
    
    // If no settings, create and return default
    const { id, updatedAt, ...defaultsWithoutId } = samplePlatformSettings;
    const defaultSettings = await prisma.platformSettings.create({
      data: {
        id: 'global',
        ...defaultsWithoutId,
        updatedAt: new Date(),
      } as any, // Cast to any to bypass type issue with JSON fields
    });
    return defaultSettings as unknown as PlatformSettings;

  } catch (error: any) {
    console.error("[Action - getPlatformSettings] Error fetching platform settings with Prisma, returning sample data:", error);
    // Fallback to sample data in case of DB error
    return samplePlatformSettings;
  }
}

export async function updatePlatformSettings(
  data: PlatformSettingsFormData
): Promise<{ success: boolean; message: string }> {
  try {
    // Prisma needs `update` with a unique identifier. Our ID is always 'global'.
    await prisma.platformSettings.update({
        where: { id: 'global' },
        data: data as any, // Cast to any to handle JSON fields correctly
    });
    revalidatePath('/admin/settings', 'layout'); // Revalidate to update server components
    return { success: true, message: 'Configurações da plataforma atualizadas com sucesso!' };
  } catch (error: any) {
      console.error("Error updating platform settings with Prisma:", error);
      return { success: false, message: `Erro ao salvar configurações: ${error.message}` };
  }
}
