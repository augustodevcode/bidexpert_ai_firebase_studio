
'use server';

import { revalidatePath } from 'next/cache';
import { db as firestoreClientDB } from '@/lib/firebase'; // SDK Cliente para leituras
import admin from 'firebase-admin';
import { dbAdmin, ensureAdminInitialized } from '@/lib/firebase/admin'; // SDK Admin para escritas
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp as ClientTimestamp } from 'firebase/firestore';
import type { LotCategory } from '@/types';
import { slugify } from '@/lib/sample-data';

function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date();
  if (timestampField instanceof admin.firestore.Timestamp) { 
    return timestampField.toDate();
  }
  if (timestampField instanceof ClientTimestamp) { // Para dados lidos pelo client SDK
    return timestampField.toDate();
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  if (timestampField instanceof Date) return timestampField;
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) return parsedDate;
  console.warn(`Could not convert category timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}


export async function createLotCategory(
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string; category?: LotCategory, categoryId?: string }> {
  const { dbAdmin: currentDbAdmin } = await ensureAdminInitialized();
  if (!currentDbAdmin) {
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível.' };
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
    const docRef = await addDoc(collection(currentDbAdmin, 'lotCategories'), {
        ...newCategoryData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria criada com sucesso!', categoryId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createLotCategory] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao criar categoria.' };
  }
}

export async function getLotCategories(): Promise<LotCategory[]> {
  if (!firestoreClientDB) {
      console.error("[getLotCategories] Firestore client DB não inicializado. Retornando array vazio.");
      return [];
  }
  try {
    const categoriesCollection = collection(firestoreClientDB, 'lotCategories');
    const q = query(categoriesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
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
   if (!firestoreClientDB) {
    console.error(`[getLotCategory for ID ${id}] Firestore client DB não inicializado. Retornando null.`);
    return null;
  }
  try {
    const categoryDocRef = doc(firestoreClientDB, 'lotCategories', id);
    const docSnap = await getDoc(categoryDocRef);
    if (docSnap.exists()) {
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
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getLotCategory] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}

export async function updateLotCategory(
  id: string,
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string }> {
  const { dbAdmin: currentDbAdmin } = await ensureAdminInitialized();
  if (!currentDbAdmin) {
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível.' };
  }
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome da categoria é obrigatório.' };
  }

  try {
    const categoryDocRef = doc(currentDbAdmin, 'lotCategories', id);
    const updateData: Partial<Omit<LotCategory, 'id' | 'createdAt'>> = { 
      name: data.name.trim(),
      slug: slugify(data.name.trim()),
      description: data.description?.trim() || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as any, 
    };
    await updateDoc(categoryDocRef, updateData);
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
  const { dbAdmin: currentDbAdmin } = await ensureAdminInitialized();
  if (!currentDbAdmin) {
    return { success: false, message: 'Erro de configuração: Admin SDK Firestore não disponível.' };
  }
  try {
    const categoryDocRef = doc(currentDbAdmin, 'lotCategories', id);
    await deleteDoc(categoryDocRef);
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria excluída com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteLotCategory] Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, message: error.message || 'Falha ao excluir categoria.' };
  }
}
