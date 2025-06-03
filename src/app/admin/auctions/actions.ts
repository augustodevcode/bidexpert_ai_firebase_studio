
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { Auction } from '@/types';

// Firestore data typically comes with Timestamps, not JS Dates directly.
// We might need a helper type if form data uses JS Date and Firestore uses Timestamp.
export type AuctionFormData = Omit<Auction, 'id' | 'createdAt' | 'updatedAt' | 'auctionDate' | 'endDate' | 'lots' | 'totalLots' | 'visits'> & {
  auctionDate: Date; // From form
  endDate?: Date; // Optional from form
};


export async function createAuction(
  data: AuctionFormData
): Promise<{ success: boolean; message: string; auctionId?: string }> {
  if (!data.title || data.title.trim() === '') {
    return { success: false, message: 'O título do leilão é obrigatório.' };
  }
  if (!data.auctionDate) {
    return { success: false, message: 'A data do leilão é obrigatória.'};
  }
  if (!data.status) {
    return { success: false, message: 'O status do leilão é obrigatório.'};
  }
  if (!data.category || data.category.trim() === '') {
    return { success: false, message: 'A categoria do leilão é obrigatória.' };
  }
   if (!data.auctioneer || data.auctioneer.trim() === '') {
    return { success: false, message: 'O nome do leiloeiro é obrigatório.' };
  }


  try {
    const newAuctionData: Omit<Auction, 'id' | 'createdAt' | 'updatedAt' | 'lots' | 'totalLots' | 'visits'> = {
      ...data,
      auctionDate: Timestamp.fromDate(new Date(data.auctionDate)),
      endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : undefined,
      totalLots: 0, // Initial value
      visits: 0,    // Initial value
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'auctions'), newAuctionData);
    revalidatePath('/admin/auctions');
    return { success: true, message: 'Leilão criado com sucesso!', auctionId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createAuction] Error creating auction:", error);
    return { success: false, message: error.message || 'Falha ao criar leilão.' };
  }
}

export async function getAuctions(): Promise<Auction[]> {
  try {
    const auctionsCollection = collection(db, 'auctions');
    const q = query(auctionsCollection, orderBy('auctionDate', 'desc')); // Example: order by date
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        auctionDate: data.auctionDate instanceof Timestamp ? data.auctionDate.toDate() : new Date(data.auctionDate),
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : (data.endDate ? new Date(data.endDate) : undefined),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Auction;
    });
  } catch (error: any) {
    console.error("[Server Action - getAuctions] Error fetching auctions:", error);
    return [];
  }
}

export async function getAuction(id: string): Promise<Auction | null> {
  try {
    const auctionDocRef = doc(db, 'auctions', id);
    const docSnap = await getDoc(auctionDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        auctionDate: data.auctionDate instanceof Timestamp ? data.auctionDate.toDate() : new Date(data.auctionDate),
        endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : (data.endDate ? new Date(data.endDate) : undefined),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Auction;
    }
    return null;
  } catch (error: any) {
    console.error("[Server Action - getAuction] Error fetching auction:", error);
    return null;
  }
}

export async function updateAuction(
  id: string,
  data: Partial<AuctionFormData> // Use Partial for updates
): Promise<{ success: boolean; message: string }> {
  if (data.title !== undefined && (data.title === null || data.title.trim() === '')) {
     return { success: false, message: 'O título do leilão não pode ser vazio se fornecido.' };
  }
   if (data.category !== undefined && (data.category === null || data.category.trim() === '')) {
    return { success: false, message: 'A categoria do leilão não pode ser vazia se fornecida.' };
  }
   if (data.auctioneer !== undefined && (data.auctioneer === null || data.auctioneer.trim() === '')) {
    return { success: false, message: 'O nome do leiloeiro não pode ser vazio se fornecido.' };
  }

  try {
    const auctionDocRef = doc(db, 'auctions', id);
    
    // Create a new object for updateData to avoid modifying the input 'data' directly
    const updateData: Partial<Auction> = { ...data }; 

    if (data.auctionDate) {
        updateData.auctionDate = Timestamp.fromDate(new Date(data.auctionDate));
    }
    if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(new Date(data.endDate));
    } else if (data.endDate === null) { // Explicitly handle null to remove the date
        updateData.endDate = undefined; // Or use deleteField() if appropriate
    }
    
    updateData.updatedAt = serverTimestamp();

    await updateDoc(auctionDocRef, updateData);
    revalidatePath('/admin/auctions');
    revalidatePath(`/admin/auctions/${id}/edit`);
    return { success: true, message: 'Leilão atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateAuction] Error updating auction:", error);
    return { success: false, message: error.message || 'Falha ao atualizar leilão.' };
  }
}

export async function deleteAuction(
  id: string
): Promise<{ success: boolean; message: string }> {
  // TODO: Consider implications: what happens to lots associated with this auction?
  // This basic delete won't delete associated lots.
  try {
    const auctionDocRef = doc(db, 'auctions', id);
    await deleteDoc(auctionDocRef);
    revalidatePath('/admin/auctions');
    return { success: true, message: 'Leilão excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteAuction] Error deleting auction:", error);
    return { success: false, message: error.message || 'Falha ao excluir leilão.' };
  }
}
