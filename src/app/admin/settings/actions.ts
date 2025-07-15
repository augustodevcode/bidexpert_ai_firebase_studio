// src/app/admin/settings/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { PlatformSettings } from '@/types';
import { revalidatePath } from 'next/cache';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);


export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const db = getDatabaseAdapter();
  return db.getPlatformSettings();
}

export async function updatePlatformSettings(data: Partial<PlatformSettings>): Promise<{ success: boolean; message: string; }> {
    const db = await getDatabaseAdapter();
    const result = await db.updatePlatformSettings(data);
    if (result.success) {
      // Revalidate all relevant paths that might use these settings
      revalidatePath('/', 'layout');
    }
    return result;
}

export async function resetSampleDataAction(): Promise<{ success: boolean; message: string; }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (typeof db.resetSampleData !== 'function') {
        return { success: false, message: 'Ação não suportada pelo adaptador de banco de dados atual.' };
    }
    // @ts-ignore
    return db.resetSampleData();
}

export async function runFullSeedAction(): Promise<{ success: boolean; message: string; }> {
    console.log('[ACTION] runFullSeedAction triggered.');
    try {
        // This executes the command `npm run db:seed` as if it were run in the terminal.
        const { stdout, stderr } = await execPromise('npm run db:seed');
        console.log('[ACTION] db:seed stdout:', stdout);
        if (stderr) {
            console.error('[ACTION] db:seed stderr:', stderr);
            // We don't necessarily throw an error on stderr, as some warnings might be printed there.
            // But we check for specific error patterns if needed.
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


export async function dropAllTablesAction(): Promise<{ success: boolean; message: string; }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (typeof db.dropAllTables !== 'function') {
        return { success: false, message: 'Ação não suportada pelo adaptador de banco de dados atual.' };
    }
    // @ts-ignore
    return db.dropAllTables();
}
