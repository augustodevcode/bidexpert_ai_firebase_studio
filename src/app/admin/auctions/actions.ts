
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy, Timestamp, where } from 'firebase/firestore';
import type { Auction, AuctionFormData } from '@/types'; 
import { slugify } from '@/lib/sample-data'; // Import slugify if used for sellers

// Helper function to safely convert Firestore Timestamp like objects or actual Timestamps to Date
function safeConvertToDate(timestampField: any): Date {
  if (!timestampField) {
    return new Date(); 
  }
  if (timestampField.toDate && typeof timestampField.toDate === 'function') {
    return timestampField.toDate(); 
  }
  if (typeof timestampField === 'object' && timestampField !== null &&
      typeof timestampField.seconds === 'number' && typeof timestampField.nanoseconds === 'number') {
    return new Date(timestampField.seconds * 1000 + timestampField.nanoseconds / 1000000); 
  }
  if (timestampField instanceof Date) {
    return timestampField; 
  }
  const parsedDate = new Date(timestampField);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn(`Could not convert auction timestamp to Date: ${JSON.stringify(timestampField)}. Returning current date.`);
  return new Date();
}

function safeConvertOptionalDate(timestampField: any): Date | undefined {
    if (!timestampField) {
      return undefined;
    }
    return safeConvertToDate(timestampField);
}


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
    const newAuctionDataForFirestore = {
      ...data,
      auctionDate: Timestamp.fromDate(new Date(data.auctionDate)),
      endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null, 
      totalLots: 0,
      visits: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    if (data.endDate === null || data.endDate === undefined) {
      (newAuctionDataForFirestore as any).endDate = null;
    }

    const docRef = await addDoc(collection(db, 'auctions'), newAuctionDataForFirestore);
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Leilão criado com sucesso!', auctionId: docRef.id };
  } catch (error: any) {
    console.error("[Server Action - createAuction] Error creating auction:", error);
    return { success: false, message: error.message || 'Falha ao criar leilão.' };
  }
}

export async function getAuctions(): Promise<Auction[]> {
  try {
    const auctionsCollection = collection(db, 'auctions');
    const q = query(auctionsCollection, orderBy('auctionDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => { 
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        fullTitle: data.fullTitle,
        description: data.description,
        status: data.status,
        auctionType: data.auctionType,
        category: data.category,
        auctioneer: data.auctioneer,
        auctioneerId: data.auctioneerId,
        seller: data.seller,
        sellerId: data.sellerId,
        auctionDate: safeConvertToDate(data.auctionDate),
        endDate: safeConvertOptionalDate(data.endDate),
        city: data.city,
        state: data.state,
        imageUrl: data.imageUrl,
        documentsUrl: data.documentsUrl,
        sellingBranch: data.sellingBranch,
        totalLots: data.totalLots || 0,
        visits: data.visits || 0,
        lots: [], 
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
      } as Auction;
    });
  } catch (error: any) {
    console.error("[Server Action - getAuctions] Error fetching auctions:", error);
    return [];
  }
}

export async function getAuctionsBySellerSlug(sellerSlug: string): Promise<Auction[]> {
  try {
    // Se o slug do vendedor for armazenado diretamente nos leilões, podemos usá-lo.
    // No entanto, é mais comum que o sellerId seja armazenado.
    // Se 'seller' no Auction armazena o nome e não o slug ou ID, esta query não funcionará como esperado.
    // Assumindo que 'seller' no Auction pode ser o nome do vendedor, e nós temos o slug:
    // Esta abordagem filtra no cliente, o que é ineficiente para grandes datasets.
    // O ideal seria ter sellerId ou sellerSlug no documento do Leilão.
    
    // Se você tiver um campo sellerSlug ou sellerId no documento 'auctions':
    // const q = query(collection(db, 'auctions'), where('sellerSlug', '==', sellerSlug), orderBy('auctionDate', 'desc'));
    // const snapshot = await getDocs(q);
    // A linha abaixo simula o resultado se você tiver 'seller' (nome) e precisa comparar com um slug.
    
    const allAuctions = await getAuctions(); // Pega todos e filtra no cliente (ineficiente)
    return allAuctions.filter(auction => auction.seller && slugify(auction.seller) === sellerSlug);

  } catch (error: any) {
    console.error(`[Server Action - getAuctionsBySellerSlug] Error fetching auctions for seller slug ${sellerSlug}:`, error);
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
        title: data.title,
        fullTitle: data.fullTitle,
        description: data.description,
        status: data.status,
        auctionType: data.auctionType,
        category: data.category,
        auctioneer: data.auctioneer,
        auctioneerId: data.auctioneerId,
        seller: data.seller,
        sellerId: data.sellerId,
        auctionDate: safeConvertToDate(data.auctionDate),
        endDate: safeConvertOptionalDate(data.endDate),
        city: data.city,
        state: data.state,
        imageUrl: data.imageUrl,
        documentsUrl: data.documentsUrl,
        sellingBranch: data.sellingBranch,
        totalLots: data.totalLots || 0,
        visits: data.visits || 0,
        lots: [],
        createdAt: safeConvertToDate(data.createdAt),
        updatedAt: safeConvertToDate(data.updatedAt),
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
  data: Partial<AuctionFormData>
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
    
    const updateDataForFirestore: Partial<any> = { ...data };

    if (data.auctionDate) {
        updateDataForFirestore.auctionDate = Timestamp.fromDate(new Date(data.auctionDate));
    }
    if (data.hasOwnProperty('endDate')) { 
        updateDataForFirestore.endDate = data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null;
    }
    if (updateDataForFirestore.hasOwnProperty('location')) {
        delete updateDataForFirestore.location;
    }

    updateDataForFirestore.updatedAt = serverTimestamp();

    await updateDoc(auctionDocRef, updateDataForFirestore);
    revalidatePath('/admin/auctions');
    revalidatePath(`/admin/auctions/${id}/edit`);
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Leilão atualizado com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - updateAuction] Error updating auction:", error);
    return { success: false, message: error.message || 'Falha ao atualizar leilão.' };
  }
}

export async function deleteAuction(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const auctionDocRef = doc(db, 'auctions', id);
    await deleteDoc(auctionDocRef);
    revalidatePath('/admin/auctions');
    revalidatePath('/consignor-dashboard/overview');
    return { success: true, message: 'Leilão excluído com sucesso!' };
  } catch (error: any) {
    console.error("[Server Action - deleteAuction] Error deleting auction:", error);
    return { success: false, message: error.message || 'Falha ao excluir leilão.' };
  }
}
