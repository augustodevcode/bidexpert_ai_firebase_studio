
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Lot } from '@/types';
import { slugify } from '@/lib/sample-data'; // Assuming slugify is useful for lots too, or remove if not

// Firestore data typically comes with Timestamps, not JS Dates directly.
// We might need a helper type if form data uses JS Date and Firestore uses Timestamp.
export type LotFormData = Omit<Lot, 'id' | 'createdAt' | 'updatedAt' | 'endDate' | 'lotSpecificAuctionDate' | 'secondAuctionDate'> & {
  endDate: Date; // From form
  lotSpecificAuctionDate?: Date;
  secondAuctionDate?: Date;
};


export async function createLot(
  data: LotFormData
): Promise<{ success: boolean; message: string; lotId?: string }> {
  if (!data.title || data.title.trim() === '') {
    return { success: false, message: 'O título do lote é obrigatório.' };
  }
  if (!data.price || data.price <= 0) {
    return { success: false, message: 'O preço inicial deve ser um valor positivo.' };
  }
  if (!data.endDate) {
    return { success: false, message: 'A data de encerramento é obrigatória.'};
  }


  try {
    const newLotData: Omit<Lot, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      views: data.views || 0,
      bidsCount: data.bidsCount || 0,
      auctionName: data.auctionName || `Leilão do Lote ${data.title.substring(0,20)}`,
      endDate: Timestamp.fromDate(new Date(data.endDate)),
      lotSpecificAuctionDate: data.lotSpecificAuctionDate ? Timestamp.fromDate(new Date(data.lotSpecificAuctionDate)) : undefined,
      secondAuctionDate: data.secondAuctionDate ? Timestamp.fromDate(new Date(data.secondAuctionDate)) : undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'lots'), newLotData);
    revalidatePath('/admin/lots');
    return { success: true, message: 'Lote criado com sucesso!', lotId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createLot] Error creating lot:", error);
    return { success: false, message: error.message || 'Falha ao criar lote.' };
  }
}

export async function getLots(): Promise<Lot[]> {
  try {
    const lotsCollection = collection(db, 'lots');
    const q = query(lotsCollection, orderBy('title', 'asc')); // Example: order by title
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to JS Dates for client-side usage if needed
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate),
        lotSpecificAuctionDate: data.lotSpecificAuctionDate instanceof Timestamp ? data.lotSpecificAuctionDate.toDate() : (data.lotSpecificAuctionDate ? new Date(data.lotSpecificAuctionDate) : undefined),
        secondAuctionDate: data.secondAuctionDate instanceof Timestamp ? data.secondAuctionDate.toDate() : (data.secondAuctionDate ? new Date(data.secondAuctionDate) : undefined),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Lot;
    });
  } catch (error: any) {
    console.error("[Server Action - getLots] Error fetching lots:", error);
    return [];
  }
}

export async function getLot(id: string): Promise<Lot | null> {
  try {
    const lotDocRef = doc(db, 'lots', id);
    const docSnap = await getDoc(lotDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : new Date(data.endDate),
        lotSpecificAuctionDate: data.lotSpecificAuctionDate instanceof Timestamp ? data.lotSpecificAuctionDate.toDate() : (data.lotSpecificAuctionDate ? new Date(data.lotSpecificAuctionDate) : undefined),
        secondAuctionDate: data.secondAuctionDate instanceof Timestamp ? data.secondAuctionDate.toDate() : (data.secondAuctionDate ? new Date(data.secondAuctionDate) : undefined),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Lot;
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getLot] Error fetching lot:", error);
    return null;
  }
}

export async function updateLot(
  id: string,
  data: Partial<LotFormData> // Use Partial for updates
): Promise<{ success: boolean; message: string }> {
  if (!data.title || data.title.trim() === '') {
    // Allow partial updates, so only validate if title is provided
    if (data.title !== undefined && (data.title === null || data.title.trim() === '')) {
       return { success: false, message: 'O título do lote não pode ser vazio se fornecido.' };
    }
  }

  try {
    const lotDocRef = doc(db, 'lots', id);
    
    const updateData: Partial<Lot> = { ...data };
    if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(new Date(data.endDate));
    }
    if (data.lotSpecificAuctionDate) {
        updateData.lotSpecificAuctionDate = Timestamp.fromDate(new Date(data.lotSpecificAuctionDate));
    }
     if (data.secondAuctionDate) {
        updateData.secondAuctionDate = Timestamp.fromDate(new Date(data.secondAuctionDate));
    }
    updateData.updatedAt = serverTimestamp();

    await updateDoc(lotDocRef, updateData);
    revalidatePath('/admin/lots');
    revalidatePath(`/admin/lots/${id}/edit`);
    return { success: true, message: 'Lote atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateLot] Error updating lot:", error);
    return { success: false, message: error.message || 'Falha ao atualizar lote.' };
  }
}

export async function deleteLot(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const lotDocRef = doc(db, 'lots', id);
    await deleteDoc(lotDocRef);
    revalidatePath('/admin/lots');
    return { success: true, message: 'Lote excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteLot] Error deleting lot:", error);
    return { success: false, message: error.message || 'Falha ao excluir lote.' };
  }
}
