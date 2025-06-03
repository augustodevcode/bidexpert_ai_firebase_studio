
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { StateInfo, StateFormData } from '@/types';
import { slugify } from '@/lib/sample-data';

// Helper function to safely convert Firestore Timestamp to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) return new Date(); 
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
  console.warn(`Could not convert state timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

export async function createState(
  data: StateFormData
): Promise<{ success: boolean; message: string; stateId?: string }> {
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome do estado é obrigatório.' };
  }
  if (!data.uf || data.uf.trim() === '' || data.uf.trim().length !== 2) {
    return { success: false, message: 'A UF do estado é obrigatória e deve ter 2 caracteres.' };
  }

  try {
    const newStateData = {
      name: data.name.trim(),
      uf: data.uf.trim().toUpperCase(),
      slug: slugify(data.name.trim()),
      cityCount: 0, // Initialize city count
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'states'), newStateData);
    revalidatePath('/admin/states');
    return { success: true, message: 'Estado criado com sucesso!', stateId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createState] Error:", error);
    return { success: false, message: error.message || 'Falha ao criar estado.' };
  }
}

export async function getStates(): Promise<StateInfo[]> {
  try {
    const statesCollection = collection(db, 'states');
    const q = query(statesCollection, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        uf: data.uf,
        slug: data.slug,
        cityCount: data.cityCount || 0,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as StateInfo;
    });
  } catch (error: any) {
    console.error("[Server Action - getStates] Error:", error);
    return [];
  }
}

export async function getState(id: string): Promise<StateInfo | null> {
  try {
    const stateDocRef = doc(db, 'states', id);
    const docSnap = await getDoc(stateDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        uf: data.uf,
        slug: data.slug,
        cityCount: data.cityCount || 0,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as StateInfo;
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getState] Error:", error);
    return null;
  }
}

export async function updateState(
  id: string,
  data: Partial<StateFormData>
): Promise<{ success: boolean; message: string }> {
  if (data.name !== undefined && (data.name === null || data.name.trim() === '')) {
     return { success: false, message: 'O nome do estado não pode ser vazio.' };
  }
  if (data.uf !== undefined && (data.uf === null || data.uf.trim() === '' || data.uf.trim().length !== 2)) {
    return { success: false, message: 'A UF do estado não pode ser vazia e deve ter 2 caracteres.' };
  }

  try {
    const stateDocRef = doc(db, 'states', id);
    
    const updateData: Partial<Omit<StateInfo, 'id' | 'createdAt' | 'cityCount'>> = {};
    if (data.name) {
        updateData.name = data.name.trim();
        updateData.slug = slugify(data.name.trim());
    }
    if (data.uf) {
        updateData.uf = data.uf.trim().toUpperCase();
    }
    updateData.updatedAt = serverTimestamp() as any;

    await updateDoc(stateDocRef, updateData);
    revalidatePath('/admin/states');
    revalidatePath(`/admin/states/${id}/edit`);
    return { success: true, message: 'Estado atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateState] Error:", error);
    return { success: false, message: error.message || 'Falha ao atualizar estado.' };
  }
}

export async function deleteState(
  id: string
): Promise<{ success: boolean; message: string }> {
  // TODO: Add check to prevent deletion if state has associated cities.
  // This would require querying the 'cities' collection.
  // For now, direct deletion is allowed.
  try {
    const stateDocRef = doc(db, 'states', id);
    await deleteDoc(stateDocRef);
    revalidatePath('/admin/states');
    return { success: true, message: 'Estado excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteState] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir estado.' };
  }
}
    
