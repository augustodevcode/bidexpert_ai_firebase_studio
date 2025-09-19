// src/app/admin/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { PlatformSettings } from '@/types';
import { PlatformSettingsService } from '@/services/platform-settings.service';
import { runFullSeedAction as seedAction } from './actions-old'; 

const settingsService = new PlatformSettingsService();

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  console.log('[getPlatformSettings Action] Fetching settings via service...');
  try {
    const settings = await settingsService.getSettings();
    return settings;
  } catch (error: any) {
    console.error("[getPlatformSettings Action] Error fetching or creating settings:", error);
    const errorMessage = error.name + ': ' + error.message;
    throw new Error(`[getPlatformSettings Action] Error: ${errorMessage}`);
  }
}


export async function updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    const result = await settingsService.updateSettings(data);
    
    if (result.success && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        revalidatePath('/', 'layout');
    }
    
    return result;
}

export async function runFullSeedAction(): Promise<{ success: boolean; message: string; }> {
    return await seedAction();
}
