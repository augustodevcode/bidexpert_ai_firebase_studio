
'use server';

import { revalidatePath } from 'next/cache';
import { dbAdmin, storageAdmin, ensureAdminInitialized } from '@/lib/firebase/admin';
import admin from 'firebase-admin';
import type { MediaItem } from '@/types';
import { v4 as uuidv4 } from 'uuid'; // Para nomes de arquivo únicos

// Helper to convert Firestore Timestamps
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof admin.firestore.Timestamp) {
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new admin.firestore.Timestamp(timestampField.seconds, timestampField.nanoseconds).toDate();
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
  await ensureAdminInitialized(); // Garante que SDK Admin esteja pronto

  if (!dbAdmin || !storageAdmin) {
    const msg = 'Erro de configuração: Admin SDK Firestore ou Storage não disponível para handleImageUpload.';
    console.error(`[Server Action - handleImageUpload] ${msg}`);
    return { success: false, message: msg };
  }

  const files = formData.getAll('files') as File[]; // 'files' deve ser o nome do campo no FormData
  if (!files || files.length === 0) {
    return { success: false, message: 'Nenhum arquivo para upload.' };
  }

  const uploadedItems: MediaItem[] = [];
  const bucket = storageAdmin.bucket();

  try {
    for (const file of files) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const uniqueFilename = `${uuidv4()}-${file.name}`;
      const filePath = `media_uploads/${uniqueFilename}`; // Caminho no Storage

      const storageFile = bucket.file(filePath);
      await storageFile.save(fileBuffer, {
        metadata: { contentType: file.type },
      });

      // Torna o arquivo público para leitura (ou use getSignedUrl para URLs temporárias)
      await storageFile.makePublic();
      const publicUrl = storageFile.publicUrl();
      
      // Placeholder para obter dimensões se for imagem - pode precisar de biblioteca externa
      // const dimensions = { width: 0, height: 0 }; // await getImageDimensions(fileBuffer);

      const newMediaItemData = {
        fileName: file.name,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        // uploadedBy: currentUserId, // Obtenha o ID do usuário atual aqui
        title: file.name, 
        altText: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        // dimensions,
        urlOriginal: publicUrl,
        urlThumbnail: publicUrl, // Idealmente, gere thumbnails no Storage (e.g., com Cloud Functions)
        urlMedium: publicUrl,
        urlLarge: publicUrl,
        linkedLotIds: [],
        dataAiHint: formData.get(`dataAiHint_${file.name}`) as string || 'upload usuario',
      };
      const docRef = await dbAdmin.collection('mediaItems').add(newMediaItemData);
      uploadedItems.push({
        id: docRef.id,
        ...newMediaItemData,
        uploadedAt: new Date(), // Aproximado para o retorno, Firestore terá o serverTimestamp
        urlOriginal: publicUrl,
        urlThumbnail: publicUrl,
        urlMedium: publicUrl,
        urlLarge: publicUrl,
      } as MediaItem);
    }
    revalidatePath('/admin/media');
    return { success: true, message: `${uploadedItems.length} arquivo(s) enviado(s) com sucesso!`, items: uploadedItems };
  } catch (error: any) {
    console.error("[Server Action - handleImageUpload] Error:", error);
    return { success: false, message: error.message || 'Falha ao fazer upload do(s) arquivo(s).' };
  }
}


export async function getMediaItems(): Promise<MediaItem[]> {
  await ensureAdminInitialized();
  if (!dbAdmin) {
    console.warn("[Server Action - getMediaItems] dbAdmin não inicializado. Retornando array de exemplo.");
    return [
      { id: 'sample1', fileName: 'sample_image_1.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 102400, urlOriginal: 'https://placehold.co/800x600.png?text=Sample1', urlThumbnail: 'https://placehold.co/150x150.png?text=Sample1', urlMedium: 'https://placehold.co/600x400.png?text=Sample1', urlLarge: 'https://placehold.co/800x600.png?text=Sample1', title: 'Imagem de Exemplo 1', altText: 'Imagem de Exemplo 1', dataAiHint: 'amostra um', linkedLotIds: [] },
      { id: 'sample2', fileName: 'another_example.png', uploadedAt: new Date(), mimeType: 'image/png', sizeBytes: 204800, urlOriginal: 'https://placehold.co/800x600.png?text=Sample2', urlThumbnail: 'https://placehold.co/150x150.png?text=Sample2', urlMedium: 'https://placehold.co/600x400.png?text=Sample2', urlLarge: 'https://placehold.co/800x600.png?text=Sample2', title: 'Exemplo PNG Dois', altText: 'Outra imagem de Exemplo', dataAiHint: 'amostra dois', linkedLotIds: []  },
    ];
  }
  try {
    const mediaCollection = dbAdmin.collection('mediaItems');
    const q = query(mediaCollection, orderBy('uploadedAt', 'desc'));
    const snapshot = await q.get(); // Usando get() do Admin SDK
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
    console.warn(`[Server Action - getMediaItems] Firestore Error: ${errorMessage}. Falling back to sample data.`);
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
  await ensureAdminInitialized();
  if (!dbAdmin) {
    const msg = 'Erro de configuração: Admin SDK Firestore não disponível para updateMediaItemMetadata.';
    console.error(`[Server Action - updateMediaItemMetadata] ${msg}`);
    return { success: false, message: msg };
  }
  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  try {
    const mediaDocRef = dbAdmin.collection('mediaItems').doc(id);
    await mediaDocRef.update({ ...metadata, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    revalidatePath('/admin/media');
    return { success: true, message: 'Metadados da imagem atualizados com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateMediaItemMetadata] Error:", error);
    return { success: false, message: error.message || 'Falha ao atualizar metadados.' };
  }
}

export async function deleteMediaItem(
  id: string
): Promise<{ success: boolean; message: string }> {
  await ensureAdminInitialized();
  if (!dbAdmin || !storageAdmin) {
    const msg = 'Erro de configuração: Admin SDK Firestore ou Storage não disponível para deleteMediaItem.';
    console.error(`[Server Action - deleteMediaItem] ${msg}`);
    return { success: false, message: msg };
  }
  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  
  try {
    const mediaDocRef = dbAdmin.collection('mediaItems').doc(id);
    const docSnap = await mediaDocRef.get();

    if (!docSnap.exists) {
      return { success: false, message: 'Item de mídia não encontrado no Firestore.' };
    }
    const mediaData = docSnap.data() as MediaItem;

    // 1. Delete from Firebase Storage
    if (mediaData.urlOriginal) {
      try {
        const bucket = storageAdmin.bucket();
        // Extrair o nome do arquivo/caminho da URL pública.
        // Exemplo: gs://<bucket-name>/media_uploads/filename.jpg
        // A URL pública é https://storage.googleapis.com/<bucket-name>/media_uploads/filename.jpg
        const urlParts = mediaData.urlOriginal.split(`/${bucket.name}/`);
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0]; // Remove query params like token
          const file = bucket.file(filePath);
          await file.delete();
          console.log(`[Server Action - deleteMediaItem] Arquivo ${filePath} excluído do Storage.`);
        } else {
          console.warn(`[Server Action - deleteMediaItem] Não foi possível extrair o caminho do arquivo da URL: ${mediaData.urlOriginal}`);
        }
      } catch (storageError: any) {
        // Não bloquear a exclusão do Firestore se a exclusão do Storage falhar, mas logar.
        console.error(`[Server Action - deleteMediaItem] Falha ao excluir do Storage (continuando com Firestore):`, storageError);
      }
    }

    // 2. Delete from Firestore
    await mediaDocRef.delete();
    console.log(`[Server Action - deleteMediaItem] Documento ${id} excluído do Firestore.`);
    
    revalidatePath('/admin/media');
    return { success: true, message: 'Mídia excluída com sucesso do Storage e Firestore.' };
  } catch (error: any) {
    console.error("[Server Action - deleteMediaItem] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir imagem.' };
  }
}

export async function linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string }> {
  await ensureAdminInitialized();
  if (!dbAdmin) {
    const msg = 'Erro de config: Admin SDK Firestore não disponível para linkMediaItemsToLot.';
    console.error(`[Server Action - linkMediaItemsToLot] ${msg}`);
    return { success: false, message: msg };
  }
  if (!lotId || !mediaItemIds || mediaItemIds.length === 0) {
    return { success: false, message: 'IDs do lote e das mídias são obrigatórios.' };
  }

  const batch = dbAdmin.batch();
  try {
    // Atualizar o lote
    const lotRef = dbAdmin.collection('lots').doc(lotId);
    batch.update(lotRef, {
      mediaItemIds: admin.firestore.FieldValue.arrayUnion(...mediaItemIds),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Atualizar cada item de mídia
    mediaItemIds.forEach(mediaId => {
      const mediaRef = dbAdmin.collection('mediaItems').doc(mediaId);
      batch.update(mediaRef, {
        linkedLotIds: admin.firestore.FieldValue.arrayUnion(lotId)
      });
    });

    await batch.commit();
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media'); 
    return { success: true, message: 'Mídias vinculadas ao lote com sucesso.' };
  } catch (error: any) {
    console.error('[Server Action - linkMediaItemsToLot] Error:', error);
    return { success: false, message: error.message || 'Falha ao vincular mídias.' };
  }
}

export async function unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string }> {
  await ensureAdminInitialized();
   if (!dbAdmin) {
    const msg = 'Erro de config: Admin SDK Firestore não disponível para unlinkMediaItemFromLot.';
    console.error(`[Server Action - unlinkMediaItemFromLot] ${msg}`);
    return { success: false, message: msg };
  }
  if (!lotId || !mediaItemId) {
    return { success: false, message: 'ID do lote e da mídia são obrigatórios.' };
  }
  
  const batch = dbAdmin.batch();
  try {
    // Atualizar o lote
    const lotRef = dbAdmin.collection('lots').doc(lotId);
    batch.update(lotRef, {
      mediaItemIds: admin.firestore.FieldValue.arrayRemove(mediaItemId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Atualizar o item de mídia
    const mediaRef = dbAdmin.collection('mediaItems').doc(mediaItemId);
    batch.update(mediaRef, {
      linkedLotIds: admin.firestore.FieldValue.arrayRemove(lotId)
    });

    await batch.commit();
    revalidatePath(`/admin/lots/${lotId}/edit`);
    revalidatePath('/admin/media');
    return { success: true, message: 'Mídia desvinculada do lote com sucesso.' };
  } catch (error: any) {
    console.error('[Server Action - unlinkMediaItemFromLot] Error:', error);
    return { success: false, message: error.message || 'Falha ao desvincular mídia.' };
  }
}
