
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { MediaItem } from '@/types';
import { slugify } from '@/lib/sample-data'; // Assuming you might want to slugify filenames or titles

// Helper to convert Firestore Timestamps
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  // Handle cases where it might already be a Date or a string/number representation
  if (timestampField instanceof Date) return timestampField;
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert media item timestamp: ${timestampField}. Returning current date.`);
  return new Date();
}

// Placeholder for actual file upload logic (e.g., to Firebase Storage)
// This function will only simulate the creation of a MediaItem document in Firestore.
export async function handleImageUpload(
  // files: FileList, // In a real scenario
  fileMetadatas: Pick<MediaItem, 'fileName' | 'mimeType' | 'sizeBytes' | 'dataAiHint'>[]
): Promise<{ success: boolean; message: string; items?: MediaItem[] }> {
  if (!fileMetadatas || fileMetadatas.length === 0) {
    return { success: false, message: 'Nenhum arquivo para upload.' };
  }

  const uploadedItems: MediaItem[] = [];

  try {
    for (const metadata of fileMetadatas) {
      // Simulate getting a URL from Firebase Storage
      const placeholderUrl = `https://placehold.co/800x600.png?text=${encodeURIComponent(metadata.fileName.substring(0,10))}`;
      const newMediaItemData = {
        ...metadata,
        title: metadata.fileName, // Default title to filename
        altText: metadata.fileName,
        uploadedAt: serverTimestamp(),
        // uploadedBy: currentUserId, // Get current user ID here
        urlOriginal: placeholderUrl,
        urlThumbnail: placeholderUrl.replace('800x600', '150x150'),
        urlMedium: placeholderUrl.replace('800x600', '600x400'),
        urlLarge: placeholderUrl,
        linkedLotIds: [],
      };
      const docRef = await addDoc(collection(db, 'mediaItems'), newMediaItemData);
      uploadedItems.push({
        id: docRef.id,
        ...metadata,
        uploadedAt: new Date(), // Approximate
        urlOriginal: newMediaItemData.urlOriginal,
        urlThumbnail: newMediaItemData.urlThumbnail,
        urlMedium: newMediaItemData.urlMedium,
        urlLarge: newMediaItemData.urlLarge,
        linkedLotIds: [],
      });
    }
    revalidatePath('/admin/media');
    return { success: true, message: `${uploadedItems.length} imagem(ns) "enviada(s)" com sucesso!`, items: uploadedItems };
  } catch (error: any) {
    console.error("[Server Action - handleImageUpload] Error:", error);
    return { success: false, message: error.message || 'Falha ao simular upload de imagem(ns).' };
  }
}


export async function getMediaItems(): Promise<MediaItem[]> {
  try {
    const mediaCollection = collection(db, 'mediaItems');
    const q = query(mediaCollection, orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);
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
    // Fallback to sample data if Firestore fails
    return [
      { id: 'sample1', fileName: 'sample_image_1.jpg', uploadedAt: new Date(), mimeType: 'image/jpeg', sizeBytes: 102400, urlOriginal: 'https://placehold.co/800x600.png?text=Sample1', urlThumbnail: 'https://placehold.co/150x150.png?text=Sample1', urlMedium: 'https://placehold.co/600x400.png?text=Sample1', urlLarge: 'https://placehold.co/800x600.png?text=Sample1', title: 'Imagem de Exemplo 1', altText: 'Imagem de Exemplo 1', dataAiHint: 'amostra um' },
      { id: 'sample2', fileName: 'another_example.png', uploadedAt: new Date(), mimeType: 'image/png', sizeBytes: 204800, urlOriginal: 'https://placehold.co/800x600.png?text=Sample2', urlThumbnail: 'https://placehold.co/150x150.png?text=Sample2', urlMedium: 'https://placehold.co/600x400.png?text=Sample2', urlLarge: 'https://placehold.co/800x600.png?text=Sample2', title: 'Exemplo PNG Dois', altText: 'Outra imagem de Exemplo', dataAiHint: 'amostra dois'  },
    ];
  }
}

export async function updateMediaItemMetadata(
  id: string,
  metadata: Partial<Pick<MediaItem, 'title' | 'altText' | 'caption' | 'description'>>
): Promise<{ success: boolean; message: string }> {
  if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  try {
    const mediaDocRef = doc(db, 'mediaItems', id);
    await updateDoc(mediaDocRef, { ...metadata, updatedAt: serverTimestamp() });
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
   if (!id) return { success: false, message: 'ID da imagem não fornecido.' };
  // TODO: In a real app, check if image is linked to lots (MediaItem.linkedLotIds)
  // Also, delete the actual file from Firebase Storage
  try {
    const mediaDocRef = doc(db, 'mediaItems', id);
    await deleteDoc(mediaDocRef);
    revalidatePath('/admin/media');
    return { success: true, message: 'Imagem excluída com sucesso (apenas do Firestore por enquanto).' };
  } catch (error: any) {
    console.error("[Server Action - deleteMediaItem] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir imagem.' };
  }
}

// Action to link media items to a lot (placeholder)
export async function linkMediaItemsToLot(lotId: string, mediaItemIds: string[]): Promise<{ success: boolean; message: string }> {
  console.log(`Simulating linking media items [${mediaItemIds.join(', ')}] to lot ${lotId}`);
  // In a real app, update the lot document and potentially the mediaItem documents
  return { success: true, message: "Vínculo de imagens simulado com sucesso." };
}

// Action to unlink a media item from a lot (placeholder)
export async function unlinkMediaItemFromLot(lotId: string, mediaItemId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Simulating unlinking media item ${mediaItemId} from lot ${lotId}`);
  return { success: true, message: "Desvinculação de imagem simulada com sucesso." };
}
