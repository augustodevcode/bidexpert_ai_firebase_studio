
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { LotCategory } from '@/types';
import { slugify } from '@/lib/sample-data';

// Helper function to safely convert Firestore Timestamp like objects or actual Timestamps to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) {
    return new Date(); // Fallback or handle as error/undefined
  }
  // Check for Firestore Timestamp object
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate();
  }
  // Check for plain object {seconds, nanoseconds}
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000);
  }
  // Check if it's already a Date object
  if (timestampField instanceof Date) {
    return timestampField;
  }
  // Try to parse if it's a string or number that can be converted
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  // Final fallback if conversion is not possible
  console.warn(`Could not convert timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}


export async function createLotCategory(
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string; category?: LotCategory, categoryId?: string }> {
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
    // Firestore will add createdAt and updatedAt as Timestamps on the server
    const docRef = await addDoc(collection(db, 'lotCategories'), {
        ...newCategoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    revalidatePath('/admin/categories');
    // For the immediate return, we don't have the server-generated timestamps yet.
    // If we needed them, we'd have to re-fetch, but for this return type it's okay.
    return { success: true, message: 'Categoria criada com sucesso!', categoryId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createLotCategory] Error creating lot category:", error);
    return { success: false, message: error.message || 'Falha ao criar categoria.' };
  }
}

export async function getLotCategories(): Promise<LotCategory[]> {
  try {
    const categoriesCollection = collection(db, 'lotCategories');
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
    console.error("[Server Action - getLotCategories] Error fetching lot categories:", error);
    return [];
  }
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  try {
    const categoryDocRef = doc(db, 'lotCategories', id);
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
    console.error("[Server Action - getLotCategory] Error fetching lot category:", error);
    return null;
  }
}

export async function updateLotCategory(
  id: string,
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string }> {
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome da categoria é obrigatório.' };
  }

  try {
    const categoryDocRef = doc(db, 'lotCategories', id);
    const updateData: Partial<Omit<LotCategory, 'id' | 'createdAt'>> = { // Exclude createdAt from update type
      name: data.name.trim(),
      slug: slugify(data.name.trim()),
      description: data.description?.trim() || '',
      updatedAt: serverTimestamp() as any, // Firestore will convert this to Timestamp
    };
    await updateDoc(categoryDocRef, updateData);
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${id}/edit`);
    return { success: true, message: 'Categoria atualizada com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateLotCategory] Error updating lot category:", error);
    return { success: false, message: error.message || 'Falha ao atualizar categoria.' };
  }
}

export async function deleteLotCategory(
  id: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const categoryDocRef = doc(db, 'lotCategories', id);
    await deleteDoc(categoryDocRef);
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria excluída com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteLotCategory] Error deleting lot category:", error);
    return { success: false, message: error.message || 'Falha ao excluir categoria.' };
  }
}
