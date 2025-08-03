
// src/app/admin/media/actions.ts
'use server';

import type { MediaItem } from '@/types';
import { revalidatePath } from 'next/cache';
import { MediaService } from '@/services/media.service';

const mediaService = new MediaService();

export async function getMediaItems(): Promise<MediaItem[]> {
  return mediaService.getMediaItems();
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
  const result = await mediaService.deleteMediaItem(id);
  if (result.success && process.env.NODE_ENV !== 'test') {
    revalidatePath('/admin/media');
  }
  return result;
}
