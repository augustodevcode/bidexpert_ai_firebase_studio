
'use server';

import { revalidatePath } from 'next/cache';
import { getStorageAdapter } from '@/lib/storage';
import { getDatabaseAdapter } from '@/lib/database';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// NOTE: The primary upload logic has been moved to `/api/upload/route.ts`
// This is the recommended approach for handling file uploads in Next.js,
// as API Routes are better suited for multipart/form-data than Server Actions.

export async function getMediaItems(): Promise<MediaItem[]> {
  const db = await getDatabaseAdapter();
  return db.getMediaItems();
}

export async function updateMediaItemMetadata(
  id: string,
  metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.updateMediaItemMetadata(id, metadata);
  if (result.success) {
      revalidatePath('/admin/media');
  }
  return result;
}

export async function deleteMediaItem(id: string): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const storage = await getStorageAdapter();

  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  
  const mediaItemData = await db.getMediaItem(id);
  if (!mediaItemData) {
      return { success: false, message: 'Item de mídia não encontrado no banco de dados.'};
  }

  if (mediaItemData.storagePath) {
    const storageResult = await storage.delete(mediaItemData.storagePath);
    if (!storageResult.success) {
        console.error(`[deleteMediaItem Action] Falha ao excluir do storage: ${storageResult.message}`);
    }
  } else {
      console.warn(`[deleteMediaItem Action] Item de mídia ${id} não possui storagePath. Pulando exclusão do storage.`);
  }

  const dbResult = await db.deleteMediaItemFromDb(id);
  
  if (dbResult.success) {
    revalidatePath('/admin/media');
  }

  return dbResult;
}


export async function linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.linkMediaItemsToLot(lotId, mediaItemIds);
  if(result.success) {
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media');
  }
  return result;
}

export async function unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string }> {
  const db = await getDatabaseAdapter();
  const result = await db.unlinkMediaItemFromLot(lotId, mediaItemId);
  if(result.success) {
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media');
  }
  return result;
}
