
'use server';

import { revalidatePath } from 'next/cache';
import { 
  ensureAdminInitialized, 
  FieldValue, 
  Timestamp as AdminTimestamp 
} from '@/lib/firebase/admin'; 
import type { Timestamp as ClientTimestamp } from 'firebase/firestore'; // Client Timestamp for type checking
import type { LotCategory } from '@/types';
import { slugify } from '@/lib/sample-data';

// Helper function to convert Firestore Timestamps (Admin or Client) to Date, or handle existing Dates
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date(); 
  if (timestampField instanceof AdminTimestamp || timestampField instanceof (global as any).FirebaseFirestore?.Timestamp) { 
    return timestampField.toDate();
  }
  // Check for Client SDK Timestamp structure if it's not an instance (e.g., after serialization)
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new AdminTimestamp(timestampField.seconds, timestampField.nanoseconds).toDate(); 
  }
  if (timestampField instanceof Date) {
    return timestampField;
  }
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn(`[categories/actions] Could not convert timestamp: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}


export async function createLotCategory(
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string; category?: LotCategory, categoryId?: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    console.error(`[Server Action - createLotCategory] Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`);
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome da categoria é obrigatório.' };
  }

  try {
    const newCategoryData: Omit<LotCategory, 'id' | 'createdAt' | 'updatedAt'> = {
      name: data.name.trim(),
      slug: slugify(data.name.trim()),
      description: data.description?.trim() || '',
      itemCount: 0,
    };
    const docRef = await currentDbAdmin.collection('lotCategories').add({
        ...newCategoryData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria criada com sucesso!', categoryId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createLotCategory] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao criar categoria.' };
  }
}

export async function getLotCategories(): Promise<LotCategory[]> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = ensureAdminInitialized();
   if (sdkError || !currentDbAdmin) {
     console.warn("[Server Action - getLotCategories] Admin SDK Firestore não disponível. Retornando array vazio.", sdkError);
     return [];
   }
  try {
    const snapshot = await currentDbAdmin.collection('lotCategories').orderBy('name', 'asc').get();
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        itemCount: data.itemCount || 0,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as LotCategory;
    });
  } catch (error: any) {
    console.error("[Server Action - getLotCategories] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    console.warn(`[Server Action - getLotCategory for ID ${id}] Admin SDK Firestore não disponível. Retornando null.`, sdkError);
    return null;
  }
 try {
    const categoryDocRef = currentDbAdmin.collection('lotCategories').doc(id);
    const docSnap = await categoryDocRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      if (!data) return null; 
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        itemCount: data.itemCount || 0,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as LotCategory;
    }
    return null;
  } catch (error: any) {
    console.error(`[Server Action - getLotCategory with ID ${id}] Error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function updateLotCategory(
  id: string,
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
    console.error(`[Server Action - updateLotCategory for ID ${id}] Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`);
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome da categoria é obrigatório.' };
  }

  try {
    const categoryDocRef = currentDbAdmin.collection('lotCategories').doc(id);
    const updateData: Partial<Omit<LotCategory, 'id' | 'createdAt'>> = { 
      name: data.name.trim(),
      slug: slugify(data.name.trim()),
      description: data.description?.trim() || '',
      updatedAt: FieldValue.serverTimestamp() as any,
    };
    await categoryDocRef.update(updateData);
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${id}/edit`);
    return { success: true, message: 'Categoria atualizada com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateLotCategory] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao atualizar categoria.' };
  }
}

export async function deleteLotCategory(
  id: string,
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin, error: sdkError } = ensureAdminInitialized();
  if (sdkError || !currentDbAdmin) {
     console.error(`[Server Action - deleteLotCategory for ID ${id}] Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}`);
    return { success: false, message: `Erro de configuração: Admin SDK Firestore não disponível. Detalhe: ${sdkError?.message || 'SDK não inicializado'}` };
  }
  try {
    const categoryDocRef = currentDbAdmin.collection('lotCategories').doc(id);
    await categoryDocRef.delete();
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria excluída com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteLotCategory] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao excluir categoria.' };
  }
}
