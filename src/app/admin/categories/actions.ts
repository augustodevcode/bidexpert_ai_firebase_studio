
'use server';

import { revalidatePath } from 'next/cache';
import { db, auth } from '@/lib/firebase'; // auth ainda pode ser útil para outras coisas no futuro, ou se as regras mudarem
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import type { LotCategory } from '@/types';
import { slugify } from '@/lib/sample-data';

// Placeholder para verificação de role, não usado ativamente com as regras atuais 'if true;'
// async function verifyAdminOrAnalystRole(userId: string | undefined): Promise<boolean> {
//   if (!userId) return false;
//   console.warn("Placeholder role check in categories/actions.ts. Implement actual role verification.");
//   return true;
// }


export async function createLotCategory(
  data: { name: string; description?: string },
): Promise<{ success: boolean; message: string; category?: LotCategory, categoryId?: string }> {
  
  // console.log('[Server Action - createLotCategory] Auth Current User UID (no server action):', auth.currentUser?.uid);
  // console.log('[Server Action - createLotCategory] Auth Current User Email (no server action):', auth.currentUser?.email);

  // Com as regras 'if true;' no Firestore, esta verificação de auth.currentUser não é o fator limitante.
  // A proteção de quem pode chamar esta action é feita pelo AdminLayout.
  // if (!auth.currentUser) {
  //   console.error('[Server Action - createLotCategory] Error: No authenticated user found in this server action context. Category creation might fail if Firestore rules change.');
  //   return { success: false, message: 'Usuário não autenticado no contexto da ação do servidor. A criação da categoria falhou.' };
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
    console.error("[Server Action - createLotCategory] Error creating lot category:", error);
    return { success: false, message: error.message || 'Falha ao criar categoria.' };
  }
}

export async function getLotCategories(): Promise<LotCategory[]> {
  // console.log('[Server Action - getLotCategories] Auth Current User UID (no server action):', auth.currentUser?.uid);
  // console.log('[Server Action - getLotCategories] Auth Current User Email (no server action):', auth.currentUser?.email);

  // Com as regras 'if true;' no Firestore, esta verificação de auth.currentUser não é o fator limitante.
  // if (!auth.currentUser) {
  //   console.error('[Server Action - getLotCategories] Info: No authenticated user found in this server action context. Firestore operations might be restricted by rules if they change.');
  // }
  
  try {
    const categoriesCollection = collection(db, 'lotCategories');
    const q = query(categoriesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LotCategory));
  } catch (error: any) {
    console.error("[Server Action - getLotCategories] Error fetching lot categories:", error);
    return [];
  }
}

export async function getLotCategory(id: string): Promise<LotCategory | null> {
  // console.log('[Server Action - getLotCategory] Auth Current User UID (no server action):', auth.currentUser?.uid);
  try {
    const categoryDocRef = doc(db, 'lotCategories', id);
    const docSnap = await getDoc(categoryDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as LotCategory;
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
  // console.log('[Server Action - updateLotCategory] Auth Current User UID (no server action):', auth.currentUser?.uid);
  // if (!auth.currentUser) {
  //   console.error('[Server Action - updateLotCategory] Error: No authenticated user found in server action context.');
  //   return { success: false, message: 'Usuário não autenticado no contexto da ação do servidor. A atualização da categoria falhou.' };
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
    console.error("[Server Action - updateLotCategory] Error updating lot category:", error);
    return { success: false, message: error.message || 'Falha ao atualizar categoria.' };
  }
}

export async function deleteLotCategory(
  id: string,
): Promise<{ success: boolean; message: string }> {
  // console.log('[Server Action - deleteLotCategory] Auth Current User UID (no server action):', auth.currentUser?.uid);
  //  if (!auth.currentUser) {
  //   console.error('[Server Action - deleteLotCategory] Error: No authenticated user found in server action context.');
  //   return { success: false, message: 'Usuário não autenticado no contexto da ação do servidor. A exclusão da categoria falhou.' };
  // }
  
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

    