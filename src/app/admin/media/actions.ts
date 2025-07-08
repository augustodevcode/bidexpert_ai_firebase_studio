
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ensureAdminInitialized } from '@/lib/firebase/admin';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function getMediaItems(): Promise<MediaItem[]> {
  try {
    const items = await prisma.mediaItem.findMany({
      orderBy: { uploadedAt: 'desc' },
    });
    return items as unknown as MediaItem[];
  } catch (error: any) {
    console.error("Error fetching media items:", error);
    return [];
  }
}

export async function updateMediaItemMetadata(
  id: string,
  metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.mediaItem.update({
      where: { id },
      data: metadata,
    });
    revalidatePath('/admin/media');
    return { success: true, message: 'Metadados atualizados com sucesso.' };
  } catch (error: any) {
    console.error(`Error updating media item ${id}:`, error);
    return { success: false, message: `Falha ao atualizar metadados: ${error.message}` };
  }
}

export async function deleteMediaItem(id: string): Promise<{ success: boolean; message: string }> {
  const { storage } = ensureAdminInitialized();
  if (!storage) {
    return { success: false, message: "Firebase Storage não inicializado." };
  }

  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };

  try {
    const mediaItemData = await prisma.mediaItem.findUnique({ where: { id } });
    if (!mediaItemData) {
      return { success: false, message: 'Item de mídia não encontrado no banco de dados.' };
    }

    // Delete from Firebase Storage if storagePath exists
    if (mediaItemData.storagePath) {
      try {
        await storage.bucket().file(mediaItemData.storagePath).delete();
      } catch (storageError: any) {
        // Log storage error but don't block DB deletion if file is already gone
        console.warn(`[deleteMediaItem Action] Falha ao excluir do storage (pode já ter sido removido): ${storageError.message}`);
      }
    }

    // Delete from Prisma DB
    await prisma.mediaItem.delete({ where: { id } });

    revalidatePath('/admin/media');
    return { success: true, message: 'Item de mídia excluído com sucesso.' };
  } catch (error: any) {
    console.error(`Error deleting media item ${id}:`, error);
    return { success: false, message: `Falha ao excluir item de mídia: ${error.message}` };
  }
}

export async function linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string }> {
  if (!lotId || !mediaItemIds || mediaItemIds.length === 0) {
    return { success: false, message: "IDs de lote ou mídia inválidos." };
  }
  try {
    const lot = await prisma.lot.findUnique({ where: { id: lotId } });
    if (!lot) return { success: false, message: "Lote não encontrado." };

    const currentMediaIds = new Set(lot.mediaItemIds as string[] || []);
    mediaItemIds.forEach(id => currentMediaIds.add(id));
    
    await prisma.lot.update({
      where: { id: lotId },
      data: {
        mediaItemIds: Array.from(currentMediaIds),
      },
    });

    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media');
    return { success: true, message: "Mídia vinculada ao lote." };
  } catch (error: any) {
    console.error(`Error linking media to lot ${lotId}:`, error);
    return { success: false, message: `Falha ao vincular mídia: ${error.message}` };
  }
}

export async function unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string }> {
  if (!lotId || !mediaItemId) {
    return { success: false, message: "IDs de lote ou mídia inválidos." };
  }
  try {
    const lot = await prisma.lot.findUnique({ where: { id: lotId } });
    if (!lot) {
      return { success: false, message: "Lote não encontrado." };
    }
    const updatedMediaIds = (lot.mediaItemIds as string[] || []).filter(id => id !== mediaItemId);

    await prisma.lot.update({
      where: { id: lotId },
      data: { mediaItemIds: updatedMediaIds },
    });
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media');
    return { success: true, message: "Mídia desvinculada do lote." };
  } catch (error: any) {
    console.error(`Error unlinking media from lot ${lotId}:`, error);
    return { success: false, message: `Falha ao desvincular mídia: ${error.message}` };
  }
}
