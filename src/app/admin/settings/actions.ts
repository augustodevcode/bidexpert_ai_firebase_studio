
// src/app/admin/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';
import { samplePlatformSettings } from '@/prisma/seed-data';

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
    console.error("Error fetching platform settings with Prisma, returning sample data:", error);
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
