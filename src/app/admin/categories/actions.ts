
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { LotCategory } from '@/types';
import { slugify } from '@/lib/sample-data'; // Assuming slugify is here or move it to utils

// TODO: Implement proper role check for all mutating actions.
// This function would ideally fetch the user's role from Firestore based on their auth UID.
async function verifyAdminOrAnalystRole(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  // Placeholder: Replace with actual role fetching from Firestore
  // const userDocRef = doc(db, 'users', userId);
  // const userDocSnap = await getDoc(userDocRef);
  // if (userDocSnap.exists()) {
  //   const userData = userDocSnap.data() as UserProfileData;
  //   return userData.role === 'ADMINISTRATOR' || userData.role === 'AUCTION_ANALYST';
  // }
  // For now, allow if any user is logged in (very insecure, for dev only)
  // Or check a specific email for quick testing:
  // const authUser = getAuth().currentUser; // This is not directly available in server actions like this
  // if (authUser?.email === 'admin@bidexpert.com') return true;
  console.warn("Placeholder role check in categories/actions.ts. Implement actual role verification.");
  return true; // In a real app, default to false if role cannot be verified.
}


export async function createLotCategory(
  data: { name: string; description?: string },
  // userId: string | undefined // Pass userId for role check
): Promise<{ success: boolean; message: string; category?: LotCategory, categoryId?: string }> {
  // const isAdminOrAnalyst = await verifyAdminOrAnalystRole(userId);
  // if (!isAdminOrAnalyst) {
  //   return { success: false, message: 'Acesso negado. Permissão insuficiente.' };
  // }

  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome da categoria é obrigatório.' };
  }

  try {
    const newCategory: Omit<LotCategory, 'id'> = {
      name: data.name.trim(),
      slug: slugify(data.name.trim()),
      description: data.description?.trim() || '',
      itemCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'lotCategories'), newCategory);
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria criada com sucesso!', categoryId: docRef.id };
  } catch (error: any) {
    console.error("Error creating lot category:", error);
    return { success: false, message: error.message || 'Falha ao criar categoria.' };
  }
}

export async function getLotCategories(): Promise<LotCategory[]> {
  try {
    const categoriesCollection = collection(db, 'lotCategories');
    const q = query(categoriesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LotCategory));
  } catch (error: any) {
    console.error("Error fetching lot categories:", error);
    return [];
  }
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  try {
    const categoryDocRef = doc(db, 'lotCategories', id);
    const docSnap = await getDoc(categoryDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as LotCategory;
    }
    return null;
  } catch (error: any) {
    console.error("Error fetching lot category:", error);
    return null;
  }
}

export async function updateLotCategory(
  id: string,
  data: { name: string; description?: string },
  // userId: string | undefined // Pass userId for role check
): Promise<{ success: boolean; message: string }> {
  // const isAdminOrAnalyst = await verifyAdminOrAnalystRole(userId);
  // if (!isAdminOrAnalyst) {
  //   return { success: false, message: 'Acesso negado. Permissão insuficiente.' };
  // }

  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome da categoria é obrigatório.' };
  }

  try {
    const categoryDocRef = doc(db, 'lotCategories', id);
    const updateData: Partial<LotCategory> = {
      name: data.name.trim(),
      slug: slugify(data.name.trim()),
      description: data.description?.trim() || '',
      updatedAt: serverTimestamp(),
    };
    await updateDoc(categoryDocRef, updateData);
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${id}/edit`);
    return { success: true, message: 'Categoria atualizada com sucesso!' };
  } catch (error: any) {
    console.error("Error updating lot category:", error);
    return { success: false, message: error.message || 'Falha ao atualizar categoria.' };
  }
}

export async function deleteLotCategory(
  id: string,
  // userId: string | undefined // Pass userId for role check
): Promise<{ success: boolean; message: string }> {
  // const isAdminOrAnalyst = await verifyAdminOrAnalystRole(userId);
  // if (!isAdminOrAnalyst) {
  //   return { success: false, message: 'Acesso negado. Permissão insuficiente.' };
  // }
  
  // TODO: Add check if category is in use by any lots before deleting.
  // For now, direct delete.
  try {
    const categoryDocRef = doc(db, 'lotCategories', id);
    await deleteDoc(categoryDocRef);
    revalidatePath('/admin/categories');
    return { success: true, message: 'Categoria excluída com sucesso!' };
  } catch (error: any) {
    console.error("Error deleting lot category:", error);
    return { success: false, message: error.message || 'Falha ao excluir categoria.' };
  }
}
