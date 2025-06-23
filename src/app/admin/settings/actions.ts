
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
    revalidatePath('/admin/settings', 'layout'); // Revalidate the layout to ensure all components get new data
  }
  return result;
}
