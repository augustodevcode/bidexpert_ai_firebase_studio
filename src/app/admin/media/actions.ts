
'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdminInitialized } from '@/lib/firebase/admin'; // For Storage Admin
import { getDatabaseAdapter } from '@/lib/database';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function handleImageUpload(
  formData: FormData
): Promise<{ success: boolean; message: string; items?: MediaItem[] }> {
  const { storageAdmin, error: sdkError } = ensureAdminInitialized();
  const db = getDatabaseAdapter();

  if (sdkError || !storageAdmin) {
    const msg = `Erro de configuração: Admin SDK Storage não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - handleImageUpload] ${msg}`);
    return { success: false, message: msg };
  }

  const files = formData.getAll('files') as File[];
  if (!files || files.length === 0) {
    return { success: false, message: 'Nenhum arquivo para upload.' };
  }

  const uploadedItems: MediaItem[] = [];
  const bucket = storageAdmin.bucket(); // Default bucket

  try {
    for (const file of files) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const uniqueFilename = `${uuidv4()}-${file.name}`;
      const filePath = `media_uploads/${uniqueFilename}`;

      const storageFile = bucket.file(filePath);
      await storageFile.save(fileBuffer, {
        metadata: { contentType: file.type },
      });

      await storageFile.makePublic();
      const publicUrl = storageFile.publicUrl();
      
      const newMediaItemData = {
        fileName: file.name,
        // uploadedAt will be set by the adapter
        title: file.name,
        altText: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        // urlOriginal, urlThumbnail, etc. will be set by the adapter from publicUrl
        linkedLotIds: [],
        dataAiHint: formData.get(`dataAiHint_${file.name}`) as string || 'upload usuario',
      };
      
      const dbResult = await db.createMediaItem(newMediaItemData, publicUrl, 'admin_placeholder'); // Pass 'uploadedBy' if available
      if (dbResult.success && dbResult.item) {
        uploadedItems.push(dbResult.item);
      } else {
        // If DB write fails, try to delete uploaded file from storage to avoid orphans
        try { await storageFile.delete(); } catch (e) { console.warn(`Failed to cleanup orphaned file ${filePath} from storage after DB error.`, e); }
        return { success: false, message: `Falha ao salvar metadados da mídia no banco de dados: ${dbResult.message}` };
      }
    }
    revalidatePath('/admin/media');
    return { success: true, message: `${uploadedItems.length} arquivo(s) enviado(s) com sucesso!`, items: uploadedItems };
  } catch (error: any) {
    console.error("[Server Action - handleImageUpload] Error:", error);
    return { success: false, message: error.message || 'Falha ao fazer upload do(s) arquivo(s).' };
  }
}

export async function getMediaItems(): Promise<MediaItem[]> {
  const db = getDatabaseAdapter();
  return db.getMediaItems();
}

export async function updateMediaItemMetadata(
  id: string,
  metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.updateMediaItemMetadata(id, metadata);
  if (result.success) {
    revalidatePath('/admin/media');
  }
  return result;
}

export async function deleteMediaItem(id: string): Promise<{ success: boolean; message: string }> {
  const { storageAdmin, error: sdkError } = ensureAdminInitialized();
  const db = getDatabaseAdapter();

  if (sdkError || !storageAdmin) {
    const msg = `Erro de config: Admin SDK Storage não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - deleteMediaItem] ${msg}`);
    return { success: false, message: msg };
  }
  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  
  try {
    // First, get metadata from DB to find storage path
    const mediaItemData = await db.getMediaItems().then(items => items.find(item => item.id === id)); // Simplified get by ID

    if (mediaItemData && mediaItemData.urlOriginal) {
      try {
        const bucket = storageAdmin.bucket();
        const urlParts = mediaItemData.urlOriginal.split(`/${bucket.name}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0];
          const file = bucket.file(filePath);
          await file.delete();
          console.log(`[Server Action - deleteMediaItem] Arquivo ${filePath} excluído do Storage.`);
        } else {
          console.warn(`[Server Action - deleteMediaItem] Não foi possível extrair caminho do arquivo da URL: ${mediaItemData.urlOriginal} para exclusão do Storage.`);
        }
      } catch (storageError: any) {
        console.error(`[Server Action - deleteMediaItem] Falha ao excluir do Storage (continuando com DB):`, storageError);
        // Potentially decide if you want to proceed with DB deletion if storage deletion fails
      }
    } else {
      console.warn(`[Server Action - deleteMediaItem] Item de mídia com ID ${id} não encontrado ou sem URL original para exclusão do Storage.`);
    }

    const dbResult = await db.deleteMediaItemFromDb(id);
    if (dbResult.success) {
      revalidatePath('/admin/media');
    }
    return dbResult;
  } catch (error: any) {
    console.error("[Server Action - deleteMediaItem] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir imagem.' };
  }
}

export async function linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.linkMediaItemsToLot(lotId, mediaItemIds);
  if (result.success) {
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media');
  }
  return result;
}

export async function unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string }> {
  const db = getDatabaseAdapter();
  const result = await db.unlinkMediaItemFromLot(lotId, mediaItemId);
  if (result.success) {
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media');
  }
  return result;
}
