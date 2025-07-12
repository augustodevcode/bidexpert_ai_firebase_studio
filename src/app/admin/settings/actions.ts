// src/app/admin/settings/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database/index';
import type { PlatformSettings } from '@/types';
import { revalidatePath } from 'next/cache';
import { fetchPlatformSettings } from '@/lib/data-queries';

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  return fetchPlatformSettings();
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

export async function dropAllTablesAction(): Promise<{ success: boolean; message: string; }> {
    const db = await getDatabaseAdapter();
    // @ts-ignore
    if (typeof db.dropAllTables !== 'function') {
        return { success: false, message: 'Ação não suportada pelo adaptador de banco de dados atual.' };
    }
    // @ts-ignore
    return db.dropAllTables();
}