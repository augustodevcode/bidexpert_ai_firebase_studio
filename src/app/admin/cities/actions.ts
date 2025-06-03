
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, where, Timestamp } from 'firebase/firestore';
import type { CityInfo, CityFormData, StateInfo } from '@/types';
import { slugify } from '@/lib/sample-data';
import { getState } from '@/app/admin/states/actions'; // Para buscar dados do estado

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
  console.warn(`Could not convert city timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

export async function createCity(
  data: CityFormData
): Promise<{ success: boolean; message: string; cityId?: string }> {
  if (!data.name || data.name.trim() === '') {
    return { success: false, message: 'O nome da cidade é obrigatório.' };
  }
  if (!data.stateId || data.stateId.trim() === '') {
    return { success: false, message: 'O estado é obrigatório.' };
  }

  try {
    const parentState = await getState(data.stateId);
    if (!parentState) {
      return { success: false, message: 'Estado pai não encontrado.' };
    }

    const newCityData = {
      name: data.name.trim(),
      slug: slugify(data.name.trim()),
      stateId: data.stateId,
      stateUf: parentState.uf, // Denormalizando a UF do estado
      lotCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'cities'), newCityData);
    revalidatePath('/admin/cities');
    revalidatePath('/admin/states'); // Revalidar estados para possível atualização de contagem de cidades (se implementado)
    return { success: true, message: 'Cidade criada com sucesso!', cityId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createCity] Error:", error);
    return { success: false, message: error.message || 'Falha ao criar cidade.' };
  }
}

export async function getCities(stateIdFilter?: string): Promise<CityInfo[]> {
  try {
    const citiesCollection = collection(db, 'cities');
    let q;
    if (stateIdFilter) {
      q = query(citiesCollection, where('stateId', '==', stateIdFilter), orderBy('name', 'asc'));
    } else {
      q = query(citiesCollection, orderBy('name', 'asc'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        stateId: data.stateId,
        stateUf: data.stateUf,
        lotCount: data.lotCount || 0,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as CityInfo;
    });
  } catch (error: any) {
    console.error("[Server Action - getCities] Error:", error);
    return [];
  }
}

export async function getCity(id: string): Promise<CityInfo | null> {
  try {
    const cityDocRef = doc(db, 'cities', id);
    const docSnap = await getDoc(cityDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        slug: data.slug,
        stateId: data.stateId,
        stateUf: data.stateUf,
        lotCount: data.lotCount || 0,
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as CityInfo;
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getCity] Error:", error);
    return null;
  }
}

export async function updateCity(
  id: string,
  data: Partial<CityFormData>
): Promise<{ success: boolean; message: string }> {
  if (data.name !== undefined && (data.name === null || data.name.trim() === '')) {
     return { success: false, message: 'O nome da cidade não pode ser vazio.' };
  }
  if (data.stateId !== undefined && (data.stateId === null || data.stateId.trim() === '')) {
    return { success: false, message: 'O estado não pode ser vazio.' };
  }

  try {
    const cityDocRef = doc(db, 'cities', id);
    const updateData: Partial<Omit<CityInfo, 'id' | 'createdAt' | 'lotCount'>> = {};
    
    if (data.name) {
        updateData.name = data.name.trim();
        updateData.slug = slugify(data.name.trim());
    }
    if (data.stateId) {
        const parentState = await getState(data.stateId);
        if (!parentState) {
            return { success: false, message: 'Estado pai não encontrado para atualização.' };
        }
        updateData.stateId = data.stateId;
        updateData.stateUf = parentState.uf;
    }
    
    updateData.updatedAt = serverTimestamp() as any;

    await updateDoc(cityDocRef, updateData);
    revalidatePath('/admin/cities');
    revalidatePath(`/admin/cities/${id}/edit`);
    return { success: true, message: 'Cidade atualizada com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateCity] Error:", error);
    return { success: false, message: error.message || 'Falha ao atualizar cidade.' };
  }
}

export async function deleteCity(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const cityDocRef = doc(db, 'cities', id);
    // TODO: Consider logic to prevent deletion if city has associated lots, or to update state cityCount.
    await deleteDoc(cityDocRef);
    revalidatePath('/admin/cities');
    return { success: true, message: 'Cidade excluída com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteCity] Error:", error);
    return { success: false, message: error.message || 'Falha ao excluir cidade.' };
  }
}
    
