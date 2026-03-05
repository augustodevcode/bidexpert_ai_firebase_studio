// src/app/admin/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { PlatformSettings } from '@/types';
import { PlatformSettingsService } from '@/services/platform-settings.service';
import { runFullSeedAction as seedAction } from './actions-old'; 
import { getTenantIdFromRequest } from '@/lib/actions/auth';
import { shouldAllowDbFallback, getEnvironmentLabel } from '@/lib/db-resilience';

import { sanitizeResponse } from '@/lib/serialization-helper';

const settingsService = new PlatformSettingsService();

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  console.log('[getPlatformSettings Action] Fetching settings via service...');
  try {
    const tenantId = await getTenantIdFromRequest(true); // Allow public fallback to '1'
    const settings = await settingsService.getSettings(tenantId);
    return sanitizeResponse(settings) as PlatformSettings;
  } catch (error: any) {
    console.error("[getPlatformSettings Action] Error fetching or creating settings:", error);

    // Em ambientes de preview/desenvolvimento, retornar null quando o DB está
    // indisponível para evitar HTTP 500 em páginas públicas (Home, Layout).
    // Em VERCEL_ENV=production, o erro é relançado para não mascarar falhas reais.
    if (shouldAllowDbFallback(error)) {
      console.warn(
        `[getPlatformSettings Action] ${getEnvironmentLabel()}: DB indisponível. ` +
        'Retornando null. Verifique DATABASE_URL e a integração Prisma/Neon/Supabase ' +
        'no painel da Vercel (Settings > Integrations).'
      );
      return null;
    }

    const errorMessage = error.name + ': ' + error.message;
    throw new Error(`[getPlatformSettings Action] Error: ${errorMessage}`);
  }
}


export async function updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    const tenantId = await getTenantIdFromRequest();
    const result = await settingsService.updateSettings(tenantId, data);
    
    if (result.success && process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
        revalidatePath('/', 'layout');
    }
    
    return result;
}

export async function runFullSeedAction(): Promise<{ success: boolean; message: string; }> {
    return await seedAction();
}
