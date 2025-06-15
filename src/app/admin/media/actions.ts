
'use server';

import { revalidatePath } from 'next/cache';
import { ensureAdminInitialized } from '@/lib/firebase/admin'; // For Storage Admin
import { sampleMediaItems } from '@/lib/sample-data';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// handleImageUpload continues to use Firebase Storage as it's an external service interaction.
export async function handleImageUpload(
  formData: FormData
): Promise<{ success: boolean; message: string; items?: MediaItem[] }> {
  const { storageAdmin, error: sdkError } = ensureAdminInitialized();
  // Database adapter is not needed here as we are simulating DB operations for media with sample data
  // const db = await getDatabaseAdapter(); 

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
  const bucket = storageAdmin.bucket(); 

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
      
      // Simulate adding to sampleMediaItems (this won't persist beyond current request cycle)
      // In a real scenario, this would be an actual DB write.
      const newMediaItem: MediaItem = {
        id: `sample-media-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
        fileName: file.name,
        uploadedAt: new Date(), // Use current date for simulation
        title: file.name,
        altText: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        urlOriginal: publicUrl,
        urlThumbnail: publicUrl, // Placeholder, ideally generate thumbnails
        urlMedium: publicUrl,
        urlLarge: publicUrl,
        linkedLotIds: [],
        dataAiHint: formData.get(`dataAiHint_${file.name}`) as string || 'upload usuario',
        uploadedBy: 'admin_placeholder', // Simulate
      };
      // sampleMediaItems.unshift(newMediaItem); // Add to the beginning for visibility if list is re-read
      uploadedItems.push(newMediaItem);
      console.log(`[Action - handleImageUpload - SampleData Mode] Simulating DB save for: ${file.name}, URL: ${publicUrl}`);
    }
    revalidatePath('/admin/media');
    return { success: true, message: `${uploadedItems.length} arquivo(s) enviado(s) com sucesso (Storage OK, DB simulado)!`, items: uploadedItems };
  } catch (error: any) {
    console.error("[Server Action - handleImageUpload] Error:", error);
    return { success: false, message: error.message || 'Falha ao fazer upload do(s) arquivo(s).' };
  }
}

export async function getMediaItems(): Promise<MediaItem[]> {
  console.log('[Action - getMediaItems - SampleData Mode] Fetching from sample-data.ts');
  await delay(50);
  return Promise.resolve(JSON.parse(JSON.stringify(sampleMediaItems)));
}

export async function updateMediaItemMetadata(
  id: string,
  metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - updateMediaItemMetadata - SampleData Mode] Simulating update for ID: ${id} with data:`, metadata);
  await delay(100);
  // Find and update in sampleMediaItems in memory (won't persist file change)
  const itemIndex = sampleMediaItems.findIndex(item => item.id === id);
  if (itemIndex > -1) {
    // sampleMediaItems[itemIndex] = { ...sampleMediaItems[itemIndex], ...metadata, updatedAt: new Date() };
    console.log(`[Action - updateMediaItemMetadata - SampleData Mode] Simulated update in-memory for ${id}.`);
  }
  revalidatePath('/admin/media');
  return { success: true, message: 'Metadados (simulados) atualizados.' };
}

export async function deleteMediaItem(id: string): Promise<{ success: boolean; message: string }> {
  const { storageAdmin, error: sdkError } = ensureAdminInitialized();
  // No DB adapter needed for sample data mode for this part

  if (sdkError || !storageAdmin) {
    const msg = `Erro de config: Admin SDK Storage não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - deleteMediaItem] ${msg}`);
    return { success: false, message: msg };
  }
  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  
  console.log(`[Action - deleteMediaItem - SampleData Mode] Simulating deletion for ID: ${id}`);
  await delay(100);

  const mediaItemData = sampleMediaItems.find(item => item.id === id);

  if (mediaItemData && mediaItemData.urlOriginal && !mediaItemData.urlOriginal.startsWith('https://placehold.co')) { // Don't delete placeholders
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
      console.error(`[Server Action - deleteMediaItem] Falha ao excluir do Storage (continuando com simulação de DB):`, storageError);
    }
  }
  // Remove from sampleMediaItems in memory (won't persist file change)
  // const itemIndex = sampleMediaItems.findIndex(item => item.id === id);
  // if (itemIndex > -1) sampleMediaItems.splice(itemIndex, 1);
  
  revalidatePath('/admin/media');
  return { success: true, message: `Item de mídia (simulado) com ID ${id} excluído do DB e Storage (se aplicável).` };
}


export async function linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - linkMediaItemsToLot - SampleData Mode] Simulating link for lot ${lotId} with media: ${mediaItemIds.join(', ')}`);
  await delay(50);
  revalidatePath(`/admin/lots/${lotId}/edit`);
  revalidatePath('/admin/media');
  return { success: true, message: 'Mídias (simuladas) vinculadas.'};
}

export async function unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string }> {
  console.log(`[Action - unlinkMediaItemFromLot - SampleData Mode] Simulating unlink for lot ${lotId} from media: ${mediaItemId}`);
  await delay(50);
  revalidatePath(`/admin/lots/${lotId}/edit`);
  revalidatePath('/admin/media');
  return { success: true, message: 'Mídia (simulada) desvinculada.'};
}

    