
'use server';

import { revalidatePath } from 'next/cache';
import { getStorageAdapter } from '@/lib/storage'; // Import the new storage factory
import { getDatabaseAdapter } from '@/lib/database';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function handleImageUpload(
  formData: FormData
): Promise<{ success: boolean; message: string; items?: MediaItem[] }> {
  const storage = await getStorageAdapter();
  const db = await getDatabaseAdapter();

  const files = formData.getAll('files') as File[];
  if (!files || files.length === 0) {
    return { success: false, message: 'Nenhum arquivo para upload.' };
  }

  const uploadedItems: MediaItem[] = [];

  try {
    for (const file of files) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const uniqueFilename = `${uuidv4()}-${file.name}`;
      
      const { publicUrl, storagePath } = await storage.upload(uniqueFilename, file.type, fileBuffer);
      
      const mediaItemData: Omit<MediaItem, 'id' | 'uploadedAt'> = {
        fileName: file.name,
        storagePath: storagePath,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        altText: file.name.replace(/\.[^/.]+$/, ""),
        mimeType: file.type,
        sizeBytes: file.size,
        urlOriginal: publicUrl,
        urlThumbnail: publicUrl, // Placeholder - idealmente gerado por uma função
        urlMedium: publicUrl,
        urlLarge: publicUrl,
        linkedLotIds: [],
        dataAiHint: formData.get(`dataAiHint_${file.name}`) as string || 'upload usuario',
        uploadedBy: 'admin_placeholder', // TODO: Obter ID do usuário logado
      };
      
      const dbResult = await db.createMediaItem(mediaItemData, publicUrl, 'admin_placeholder');
      
      if (dbResult.success && dbResult.item) {
        uploadedItems.push(dbResult.item);
      } else {
        throw new Error(dbResult.message || `Falha ao salvar metadados do arquivo ${file.name} no banco de dados.`);
      }
    }
    
    revalidatePath('/admin/media');
    return { success: true, message: `${uploadedItems.length} arquivo(s) enviado(s) com sucesso!`, items: uploadedItems };

  } catch (error: any) {
    console.error("[Server Action - handleImageUpload] Error:", error);
    // TODO: Implementar lógica de rollback (excluir arquivos já upados se o DB falhar)
    return { success: false, message: error.message || 'Falha ao fazer upload do(s) arquivo(s).' };
  }
}

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
  
  // 1. Obter dados do item de mídia do DB para pegar o storagePath
  const mediaItemData = await db.getMediaItem(id);
  if (!mediaItemData) {
      return { success: false, message: 'Item de mídia não encontrado no banco de dados.'};
  }

  // 2. Excluir do storage (nuvem ou local)
  if (mediaItemData.storagePath) {
    const storageResult = await storage.delete(mediaItemData.storagePath);
    if (!storageResult.success) {
        // Logar o erro mas continuar para tentar remover do DB
        console.error(`[deleteMediaItem Action] Falha ao excluir do storage: ${storageResult.message}`);
    }
  } else {
      console.warn(`[deleteMediaItem Action] Item de mídia ${id} não possui storagePath. Pulando exclusão do storage.`);
  }

  // 3. Excluir do banco de dados
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
