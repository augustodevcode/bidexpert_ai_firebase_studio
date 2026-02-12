/**
 * @fileoverview Server Actions para a Biblioteca de Mídia (Google Photos-like).
 * Inclui CRUD de MediaItem + busca de entity links (entidades vinculadas).
 * Usa o serviço consolidado MediaService e MediaEntityLinksService.
 */
'use server';

import type { MediaItem } from '@/types';
import { revalidatePath } from 'next/cache';
import { MediaService } from '@/services/media.service';
import { getEntityLinksForMediaItems, type EntityLink } from '@/services/media-entity-links.service';
import { getStorageAdapter } from '@/lib/storage';

const mediaService = new MediaService();

export interface MediaItemWithLinks extends MediaItem {
  entityLinks?: EntityLink[];
}

export async function getMediaItems(): Promise<MediaItem[]> {
  return mediaService.getMediaItems();
}

export async function getMediaItemsWithEntityLinks(): Promise<MediaItemWithLinks[]> {
  const items = await mediaService.getMediaItems();
  if (items.length === 0) return [];

  const mediaIds = items.map((item) => BigInt(item.id));
  const linksMap = await getEntityLinksForMediaItems(mediaIds);

  return items.map((item) => ({
    ...item,
    entityLinks: linksMap[item.id] || [],
  }));
}

export async function createMediaItem(
  itemData: Partial<Omit<MediaItem, 'id'>>,
  url: string,
  userId: string
): Promise<{ success: boolean; message: string; item?: MediaItem }> {
  const result = await mediaService.createMediaItem(itemData, url, userId);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/media');
  }
  return result;
}

export async function updateMediaItemMetadata(
  id: string,
  metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  const result = await mediaService.updateMediaItemMetadata(id, metadata);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/media');
  }
  return result;
}

export async function deleteMediaItem(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const item = await mediaService.getMediaItemById(id);
    if (item?.storagePath) {
      const storage = getStorageAdapter();
      await storage.delete(item.storagePath);
    }
  } catch (err) {
    console.warn('[deleteMediaItem] Could not delete file from storage:', err);
  }

  const result = await mediaService.deleteMediaItem(id);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/media');
  }
  return result;
}

export async function deleteMultipleMediaItems(
  ids: string[]
): Promise<{ success: boolean; successCount: number; errorCount: number }> {
  let successCount = 0;
  let errorCount = 0;

  for (const id of ids) {
    const result = await deleteMediaItem(id);
    if (result.success) successCount++;
    else errorCount++;
  }

  if (successCount > 0 && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/media');
  }

  return { success: errorCount === 0, successCount, errorCount };
}
