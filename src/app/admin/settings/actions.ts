
'use server';

import { revalidatePath } from 'next/cache';
import { getDatabaseAdapter } from '@/lib/database';
import type { PlatformSettings, PlatformSettingsFormData } from '@/types';

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const db = await getDatabaseAdapter();
  return db.getPlatformSettings();
}

export async function updatePlatformSettings(
  data: PlatformSettingsFormData
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updatePlatformSettings(data);
  if (result.success) {
    // The revalidation is handled by the client-side fetch on success,
    // which avoids potential race conditions with the dev server's cache.
    // revalidatePath('/admin/settings', 'layout'); 
  }
  return result;
}
