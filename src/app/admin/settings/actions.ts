// src/app/admin/settings/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { PlatformSettings } from '@/types';
import { revalidatePath } from 'next/cache';


export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const db = await getDatabaseAdapter();
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
