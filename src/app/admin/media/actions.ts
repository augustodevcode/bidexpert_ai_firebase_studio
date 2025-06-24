
'use server';

import { revalidatePath } from 'next/cache';
import { getStorageAdapter } from '@/lib/storage'; // Import the new storage factory
import { getDatabaseAdapter } from '@/lib/database';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];


export async function handleImageUpload(
  formData: FormData
): Promise<{ success: boolean; message: string; items?: MediaItem[], errors?: { fileName: string; message: string }[] }> {
  try {
    const storage = await getStorageAdapter();
    const db = await getDatabaseAdapter();

    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { success: false, message: 'Nenhum arquivo para upload.' };
    }

    const uploadedItems: MediaItem[] = [];
    const uploadErrors: { fileName: string; message: string }[] = [];

    for (const file of files) {
      try {
        // --- VALIDATION START ---
        if (file.size > MAX_FILE_SIZE_BYTES) {
          uploadErrors.push({ fileName: file.name, message: `Arquivo excede o limite de ${MAX_FILE_SIZE_MB}MB.` });
          continue; // Skip this file
        }
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          uploadErrors.push({ fileName: file.name, message: `Tipo de arquivo '${file.type}' não permitido.` });
          continue; // Skip this file
        }
        // --- VALIDATION END ---

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
          // Se a gravação no DB falhar, tente excluir o arquivo do storage para evitar órfãos.
          await storage.delete(storagePath);
          throw new Error(dbResult.message || `Falha ao salvar metadados do arquivo ${file.name} no banco de dados.`);
        }
      } catch (error: any) {
          console.error(`[Server Action - handleImageUpload loop] Error processing file ${file.name}:`, error);
          uploadErrors.push({ fileName: file.name, message: error.message || 'Erro desconhecido durante o upload.' });
      }
    }
    
    let finalMessage = '';
    if (uploadedItems.length > 0) {
      finalMessage += `${uploadedItems.length} arquivo(s) enviado(s) com sucesso! `;
    }
    if (uploadErrors.length > 0) {
      finalMessage += `${uploadErrors.length} arquivo(s) falharam.`;
    }

    if (uploadedItems.length > 0) {
      revalidatePath('/admin/media');
    }

    return { 
      success: uploadErrors.length === 0 && uploadedItems.length > 0, 
      message: finalMessage.trim(), 
      items: uploadedItems,
      errors: uploadErrors
    };
  } catch (e: any) {
    console.error(`[Server Action - handleImageUpload - TOP LEVEL] Unhandled error:`, e);
    return { 
        success: false, 
        message: `Erro inesperado no servidor: ${e.message}`, 
        items: [], 
        errors: [{ fileName: 'Erro Geral do Servidor', message: e.message }]
    };
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
