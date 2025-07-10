// src/app/admin/media/actions.ts
'use server';

import { getDatabaseAdapter } from '@/lib/database';
import type { MediaItem } from '@/types';
import { revalidatePath } from 'next/cache';

export async function getMediaItems(): Promise<MediaItem[]> {
  const db = await getDatabaseAdapter();
  return db.getMediaItems();
}

export async function createMediaItem(
  itemData: Partial<Omit<MediaItem, 'id'>>,
  url: string,
  userId: string
): Promise<{ success: boolean; message: string; item?: MediaItem }> {
  const db = await getDatabaseAdapter();
  const result = await db.createMediaItem(itemData, url, userId);
  if (result.success) {
    revalidatePath('/admin/media');
  }
  return result;
}
