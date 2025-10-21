// src/app/admin/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { PlatformSettings } from '@/types';
import { PlatformSettingsService } from '@/services/platform-settings.service';
import { runFullSeedAction as seedAction } from './actions-old'; 
import { getTenantIdFromRequest } from '@/lib/actions/auth';

const settingsService = new PlatformSettingsService();

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  console.log('[getPlatformSettings Action] Fetching settings via service...');
  try {
    const tenantId = await getTenantIdFromRequest();
    // A conversão para BigInt é necessária se o ID do tenant for string
    const settings = await settingsService.getSettings(BigInt(tenantId));
    return settings as PlatformSettings;
  } catch (error: any) {
    console.error("[getPlatformSettings Action] Error fetching or creating settings:", error);
    const errorMessage = error.name + ': ' + error.message;
    throw new Error(`[getPlatformSettings Action] Error: ${errorMessage}`);
  }
}


export async function updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await settingsService.updateSettings({ ...data, tenantId: BigInt(tenantId) });
    
    if (result.success && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        revalidatePath('/', 'layout');
    }
    
    return result;
}

export async function runFullSeedAction(): Promise<{ success: boolean; message: string; }> {
    return await seedAction();
}
