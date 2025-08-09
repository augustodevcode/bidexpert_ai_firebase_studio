
// src/app/admin/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { PlatformSettings } from '@/types';
import { PlatformSettingsService } from '@/services/platform-settings.service';

const settingsService = new PlatformSettingsService();

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  return settingsService.getSettings();
}

export async function updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    console.log('[ACTION - updatePlatformSettings] Received data from form:', JSON.stringify(data, null, 2));
    const result = await settingsService.updateSettings(data);
    
    // Check for both 'test' and the presence of VITEST which is used by node:test
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
      console.log('[ACTION - updatePlatformSettings] Revalidating path "/"...');
      revalidatePath('/', 'layout');
    } else {
      console.log('[ACTION - updatePlatformSettings] Skipping revalidation in test environment.');
    }
    
    return result;
}

export async function runFullSeedAction(): Promise<{ success: boolean; message: string; }> {
    // This action remains unchanged as it doesn't use revalidatePath
    console.log('[ACTION] runFullSeedAction triggered.');
    const { exec } = await import('child_process');
    const util = await import('util');
    const execPromise = util.promisify(exec);
    try {
        const { stdout, stderr } = await execPromise('npm run db:seed');
        console.log('[ACTION] db:seed stdout:', stdout);
        if (stderr) {
            console.error('[ACTION] db:seed stderr:', stderr);
            if (stderr.toLowerCase().includes('error')) {
                 throw new Error(stderr);
            }
        }
        return { success: true, message: 'Banco de dados populado com dados de demonstração com sucesso!' };
    } catch (error: any) {
        console.error('[ACTION] Error executing db:seed script:', error);
        return { success: false, message: `Falha ao executar o script de seed: ${error.message}` };
    }
}
