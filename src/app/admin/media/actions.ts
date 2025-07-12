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

export async function updateMediaItemMetadata(
    id: string,
    metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (!db.updateMediaItemMetadata) {
    return { success: false, message: 'Funcionalidade não implementada.' };
  }
  // @ts-ignore
  const result = await db.updateMediaItemMetadata(id, metadata);
  if (result.success) {
    revalidatePath('/admin/media');
  }
  return result;
}

export async function deleteMediaItem(id: string): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  // @ts-ignore
  if (!db.deleteMediaItem) {
    return { success: false, message: 'Funcionalidade não implementada.' };
  }
  // @ts-ignore
  const result = await db.deleteMediaItem(id);
  if (result.success) {
    revalidatePath('/admin/media');
  }
  return result;
}
