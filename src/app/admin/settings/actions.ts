// src/app/admin/settings/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { exec } from 'child_process';
import util from 'util';
import type { PlatformSettings } from '@/types';
import { PlatformSettingsService } from '@/services/platform-settings.service';

const execPromise = util.promisify(exec);
const settingsService = new PlatformSettingsService();

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  return settingsService.getSettings();
}

export async function updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    const result = await settingsService.updateSettings(data);
    if (result.success) {
      revalidatePath('/', 'layout');
    }
    return result;
}

export async function runFullSeedAction(): Promise<{ success: boolean; message: string; }> {
    console.log('[ACTION] runFullSeedAction triggered.');
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
