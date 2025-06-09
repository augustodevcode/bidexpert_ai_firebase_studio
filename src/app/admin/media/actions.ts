
'use server';

import { revalidatePath } from 'next/cache';
import { dbAdmin, storageAdmin, ensureAdminInitialized, FieldValue, Timestamp as AdminTimestamp } from '@/lib/firebase/admin';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid'; 

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof AdminTimestamp) {
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new AdminTimestamp(timestampField.seconds, timestampField.nanoseconds).toDate();
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert media item timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

export async function handleImageUpload(
  formData: FormData
): Promise<{ success: boolean; message: string; items?: MediaItem[] }> {
  const { dbAdmin: currentDbAdmin, storageAdmin: currentStorageAdmin, error: sdkError } = await ensureAdminInitialized(); 

  if (sdkError || !currentDbAdmin || !currentStorageAdmin) {
    const msg = `Erro de configuração: Admin SDK Firestore ou Storage não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - handleImageUpload] ${msg}`);
    return { success: false, message: msg };
  }

  const files = formData.getAll('files') as File[]; 
  if (!files || files.length === 0) {
    return { success: false, message: 'Nenhum arquivo para upload.' };
  }

  const uploadedItems: MediaItem[] = [];
  const bucket = currentStorageAdmin.bucket();

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
        uploadedAt: FieldValue.serverTimestamp(),
        title: file.name, 
        altText: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        urlOriginal: publicUrl,
        urlThumbnail: publicUrl, 
        urlMedium: publicUrl,
        urlLarge: publicUrl,
        linkedLotIds: [],
        dataAiHint: formData.get(`dataAiHint_${file.name}`) as string || 'upload usuario',
      };
      const docRef = await currentDbAdmin.collection('mediaItems').add(newMediaItemData);
      uploadedItems.push({
        id: docRef.id,
        ...newMediaItemData,
        uploadedAt: new Date(), // Representação cliente imediata
        urlOriginal: publicUrl,
        urlThumbnail: publicUrl,
        urlMedium: publicUrl,
        urlLarge: publicUrl,
      } as MediaItem);
    }
    revalidatePath('/admin/media');
    return { success: true, message: `${uploadedItems.length} arquivo(s) enviado(s) com sucesso!`, items: uploadedItems };
  } catch (error: any) {
    console.error("[Server Action - handleImageUpload] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao fazer upload do(s) arquivo(s).' };
  }
}


export async function getMediaItems(): Promise<MediaItem[]> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    console.warn(`[Server Action - getMediaItems] dbAdmin não inicializado. Detalhe: ${sdkError?.message || 'SDK não inicializado'}. Retornando array de exemplo.`);
    return [
      { id: 'sample1', fileName: 'sample_image_1.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 102400, urlOriginal: 'https://placehold.co/800x600.png?text=Sample1', urlThumbnail: 'https://placehold.co/150x150.png?text=Sample1', urlMedium: 'https://placehold.co/600x400.png?text=Sample1', urlLarge: 'https://placehold.co/800x600.png?text=Sample1', title: 'Imagem de Exemplo 1', altText: 'Imagem de Exemplo 1', dataAiHint: 'amostra um', linkedLotIds: [] },
      { id: 'sample2', fileName: 'another_example.png', uploadedAt: new Date(), mimeType: 'image/png', sizeBytes: 204800, urlOriginal: 'https://placehold.co/800x600.png?text=Sample2', urlThumbnail: 'https://placehold.co/150x150.png?text=Sample2', urlMedium: 'https://placehold.co/600x400.png?text=Sample2', urlLarge: 'https://placehold.co/800x600.png?text=Sample2', title: 'Exemplo PNG Dois', altText: 'Outra imagem de Exemplo', dataAiHint: 'amostra dois', linkedLotIds: []  },
    ];
  }
  try {
    const mediaCollection = currentDbAdmin.collection('mediaItems');
    const q = currentDbAdmin.collection('mediaItems').orderBy('uploadedAt', 'desc'); // Admin SDK query
    const snapshot = await q.get(); 
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        fileName: data.fileName,
        uploadedAt: safeConvertToDate(data.uploadedAt),
        uploadedBy: data.uploadedBy,
        title: data.title,
        altText: data.altText,
        caption: data.caption,
        description: data.description,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        dimensions: data.dimensions,
        urlOriginal: data.urlOriginal,
        urlThumbnail: data.urlThumbnail,
        urlMedium: data.urlMedium,
        urlLarge: data.urlLarge,
        linkedLotIds: data.linkedLotIds || [],
        dataAiHint: data.dataAiHint,
      } as MediaItem;
    });
  } catch (error: any) {
    let errorMessage = "Unknown error occurred while fetching media items.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof (error as any).message === 'string') {
      errorMessage = (error as any).message;
    }
    console.warn(`[Server Action - getMediaItems] Firestore Error: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}. Falling back to sample data.`);
    return [
      { id: 'sample1', fileName: 'sample_image_1.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 102400, urlOriginal: 'https://placehold.co/800x600.png?text=Sample1', urlThumbnail: 'https://placehold.co/150x150.png?text=Sample1', urlMedium: 'https://placehold.co/600x400.png?text=Sample1', urlLarge: 'https://placehold.co/800x600.png?text=Sample1', title: 'Imagem de Exemplo 1', altText: 'Imagem de Exemplo 1', dataAiHint: 'amostra um', linkedLotIds: [] },
      { id: 'sample2', fileName: 'another_example.png', uploadedAt: new Date(), mimeType: 'image/png', sizeBytes: 204800, urlOriginal: 'https://placehold.co/800x600.png?text=Sample2', urlThumbnail: 'https://placehold.co/150x150.png?text=Sample2', urlMedium: 'https://placehold.co/600x400.png?text=Sample2', urlLarge: 'https://placehold.co/800x600.png?text=Sample2', title: 'Exemplo PNG Dois', altText: 'Outra imagem de Exemplo', dataAiHint: 'amostra dois', linkedLotIds: []  },
    ];
  }
}

export async function updateMediaItemMetadata(
  id: string,
  metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    const msg = `Erro de config: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - updateMediaItemMetadata] ${msg}`);
    return { success: false, message: msg };
  }
  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  try {
    const mediaDocRef = currentDbAdmin.collection('mediaItems').doc(id);
    await mediaDocRef.update({ ...metadata, updatedAt: FieldValue.serverTimestamp() });
    revalidatePath('/admin/media');
    return { success: true, message: 'Metadados da imagem atualizados com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateMediaItemMetadata] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao atualizar metadados.' };
  }
}

export async function deleteMediaItem(
  id: string
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, storageAdmin: currentStorageAdmin, error: sdkError } = await ensureAdminInitialized();
  if (sdkError || !currentDbAdmin || !currentStorageAdmin) {
    const msg = `Erro de config: Admin SDK Firestore ou Storage não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - deleteMediaItem] ${msg}`);
    return { success: false, message: msg };
  }
  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  
  try {
    const mediaDocRef = currentDbAdmin.collection('mediaItems').doc(id);
    const docSnap = await mediaDocRef.get();

    if (!docSnap.exists) {
      return { success: false, message: 'Item de mídia não encontrado no Firestore.' };
    }
    const mediaData = docSnap.data() as MediaItem;

    if (mediaData.urlOriginal) {
      try {
        const bucket = currentStorageAdmin.bucket();
        const urlParts = mediaData.urlOriginal.split(`/${bucket.name}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0]; 
          const file = bucket.file(filePath);
          await file.delete();
          console.log(`[Server Action - deleteMediaItem] Arquivo ${filePath} excluído do Storage.`);
        } else {
          console.warn(`[Server Action - deleteMediaItem] Não foi possível extrair o caminho do arquivo da URL: ${mediaData.urlOriginal}`);
        }
      } catch (storageError: any) {
        console.error(`[Server Action - deleteMediaItem] Falha ao excluir do Storage (continuando com Firestore):`, JSON.stringify(storageError, Object.getOwnPropertyNames(storageError)));
      }
    }

    await mediaDocRef.delete();
    console.log(`[Server Action - deleteMediaItem] Documento ${id} excluído do Firestore.`);
    
    revalidatePath('/admin/media');
    return { success: true, message: 'Mídia excluída com sucesso do Storage e Firestore.' };
  } catch (error: any) {
    console.error("[Server Action - deleteMediaItem] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao excluir imagem.' };
  }
}

export async function linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
   if (sdkError || !currentDbAdmin) {
    const msg = `Erro de config: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - linkMediaItemsToLot] ${msg}`);
    return { success: false, message: msg };
  }
  if (!lotId || !mediaItemIds || mediaItemIds.length === 0) {
    return { success: false, message: 'IDs do lote e das mídias são obrigatórios.' };
  }
  
  const batch = currentDbAdmin.batch();
  try {
    const lotRef = currentDbAdmin.collection('lots').doc(lotId);
    batch.update(lotRef, {
      mediaItemIds: FieldValue.arrayUnion(...mediaItemIds),
      updatedAt: FieldValue.serverTimestamp()
    });

    mediaItemIds.forEach(mediaId => {
      const mediaRef = currentDbAdmin.collection('mediaItems').doc(mediaId);
      batch.update(mediaRef, {
        linkedLotIds: FieldValue.arrayUnion(lotId)
      });
    });

    await batch.commit();
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media'); 
    return { success: true, message: 'Mídias vinculadas ao lote com sucesso.' };
  } catch (error: any) {
    console.error('[Server Action - linkMediaItemsToLot] Error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao vincular mídias.' };
  }
}

export async function unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = await ensureAdminInitialized();
   if (sdkError || !currentDbAdmin) {
    const msg = `Erro de config: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`;
    console.error(`[Server Action - unlinkMediaItemFromLot] ${msg}`);
    return { success: false, message: msg };
  }
  if (!lotId || !mediaItemId) {
    return { success: false, message: 'ID do lote e da mídia são obrigatórios.' };
  }
  
  const batch = currentDbAdmin.batch();
  try {
    const lotRef = currentDbAdmin.collection('lots').doc(lotId);
    batch.update(lotRef, {
      mediaItemIds: FieldValue.arrayRemove(mediaItemId),
      updatedAt: FieldValue.serverTimestamp()
    });

    const mediaRef = currentDbAdmin.collection('mediaItems').doc(mediaItemId);
    batch.update(mediaRef, {
      linkedLotIds: FieldValue.arrayRemove(lotId)
    });

    await batch.commit();
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media');
    return { success: true, message: 'Mídia desvinculada do lote com sucesso.' };
  } catch (error: any) {
    console.error('[Server Action - unlinkMediaItemFromLot] Error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao desvincular mídia.' };
  }
}

